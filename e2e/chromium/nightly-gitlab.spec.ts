import {test, expect, seedExtensionStorage, clearExtensionStorage} from './fixtures';
import {waitForGmailEmail} from './helpers/gmail-helper';
import {getFastmailMessages} from './helpers/fastmail-helper';
import {e2eEnv, hasGmailCredentials, hasFastmailCredentials, hasNightlyCredentials} from './helpers/env';

/**
 * Nightly E2E test: GitLab login OTP flow.
 *
 * This test:
 * 1. Navigates to GitLab sign-in page
 * 2. Enters the test email to trigger a confirmation/OTP email
 * 3. Waits for the OTP email to arrive (via gmail-tester or Fastmail JMAP)
 * 4. Verifies the extension popup shows the email
 * 5. Uses the extension to fill the OTP into the page
 *
 * Requires: TEST_GITLAB_EMAIL + either Gmail or Fastmail credentials.
 */
test.describe('Nightly: GitLab OTP flow', () => {
  test.beforeEach(async () => {
    test.skip(!hasNightlyCredentials() || !e2eEnv.testGitlabEmail, 'GitLab nightly credentials not available');
  });

  test.afterEach(async ({serviceWorker}) => {
    await clearExtensionStorage(serviceWorker);
  });

  test('receives and extracts GitLab OTP code via extension', async ({
    page,
    extensionId,
    serviceWorker,
    context,
  }) => {
    const useGmail = hasGmailCredentials();
    const useFastmail = hasFastmailCredentials();
    test.skip(!useGmail && !useFastmail, 'Need either Gmail or Fastmail credentials');

    // Seed the extension with the appropriate provider
    if (useGmail) {
      await seedExtensionStorage(serviceWorker, {
        provider: 'gmail',
        gmailToken: JSON.stringify({
          access_token: 'expired-placeholder',
          refresh_token: e2eEnv.gmailTestRefreshToken,
          expires_in: 0,
          token_type: 'Bearer',
        }),
        gmailTokenTimestamp: 0,
      });
    } else {
      await seedExtensionStorage(serviceWorker, {
        provider: 'fastmail',
        fastmailApiKey: e2eEnv.fastmailApiKey,
        fastmailAccountId: e2eEnv.fastmailAccountId,
      });
    }

    const timestampBefore = new Date();

    // Navigate to GitLab sign-in
    await page.goto('https://gitlab.com/users/sign_in');
    await page.waitForLoadState('networkidle');

    // Enter email to trigger OTP
    const emailInput = page.locator('input[name="user[login]"], input[name="user[email]"], #user_login, #user_email');
    await expect(emailInput.first()).toBeVisible({timeout: 10000});
    await emailInput.first().fill(e2eEnv.testGitlabEmail);

    // Submit the form (GitLab may have different flows depending on the account state)
    const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
    await submitButton.click();

    // Wait for the OTP email to arrive
    let otpFromEmail: string | undefined;

    if (useGmail) {
      const emails = await waitForGmailEmail({
        from: 'gitlab.com',
        after: timestampBefore,
        waitTimeSec: 15,
        maxWaitTimeSec: 120,
      });

      expect(emails.length).toBeGreaterThan(0);
      // Extract the OTP from email subject or body (GitLab sends 6-digit codes)
      const emailBody = emails[0]?.body?.html ?? emails[0]?.body?.text ?? '';
      const otpMatch = emailBody.match(/\b(\d{6})\b/);
      otpFromEmail = otpMatch?.[1];
    } else {
      // Poll Fastmail for the email
      let attempts = 0;
      while (attempts < 12) {
        await page.waitForTimeout(10000);
        const messages = await getFastmailMessages({afterMinutes: 5});
        const gitlabEmail = messages.find(
          (m) => m.from.includes('gitlab.com') && new Date() > timestampBefore
        );
        if (gitlabEmail) {
          const otpMatch = gitlabEmail.htmlBody.match(/\b(\d{6})\b/);
          otpFromEmail = otpMatch?.[1];
          break;
        }
        attempts++;
      }
    }

    expect(otpFromEmail).toBeTruthy();
    expect(otpFromEmail).toMatch(/^\d{6}$/);

    // Now verify the extension popup shows the GitLab email
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    // Look for a row mentioning GitLab
    const gitlabRow = popupPage.locator('tr').filter({hasText: /gitlab/i});
    await expect(gitlabRow.first()).toBeVisible({timeout: 30000});

    // The extension's parser should be able to extract the same OTP
    const copyButton = gitlabRow.first().getByRole('button', {name: /copy/i});
    await copyButton.click();
    await expect(gitlabRow.first().getByText('Copied!')).toBeVisible({timeout: 5000});
  });
});
