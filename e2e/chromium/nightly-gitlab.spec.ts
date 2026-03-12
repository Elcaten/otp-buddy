import {test, expect, seedExtensionStorage, clearExtensionStorage} from './fixtures';
import {createTigrmailInbox, waitForTigrmailEmail} from './helpers/tigrmail-helper';
import {waitForGmailEmail} from './helpers/gmail-helper';
import {e2eEnv, hasGmailCredentials, hasTigrmailCredentials, hasNightlyCredentials} from './helpers/env';

/**
 * Nightly E2E test: GitLab login OTP flow.
 *
 * This test:
 * 1. Creates a Tigrmail disposable inbox
 * 2. Navigates to GitLab sign-in page
 * 3. Enters the disposable email to trigger a confirmation/OTP email
 * 4. Waits for the OTP email via Tigrmail API
 * 5. Verifies the extension popup can show and extract the code
 *    (when configured with Gmail, since the extension only reads from
 *     Fastmail/Gmail — the Tigrmail inbox is used to independently
 *     verify the OTP arrived)
 *
 * Requires: TIGRMAIL_TOKEN + TEST_GITLAB_EMAIL (or we use the Tigrmail inbox).
 */
test.describe('Nightly: GitLab OTP flow', () => {
  test.beforeEach(async () => {
    test.skip(!hasNightlyCredentials(), 'Nightly credentials not available');
    test.skip(!hasTigrmailCredentials(), 'Tigrmail token not available');
  });

  test.afterEach(async ({serviceWorker}) => {
    await clearExtensionStorage(serviceWorker);
  });

  test('receives GitLab OTP code via Tigrmail inbox', async ({page}) => {
    // Create a fresh disposable inbox for this test
    const tigrmailInbox = await createTigrmailInbox();
    expect(tigrmailInbox).toContain('@');

    // Navigate to GitLab sign-in
    await page.goto('https://gitlab.com/users/sign_in');
    await page.waitForLoadState('networkidle');

    // Enter the Tigrmail email to trigger OTP
    const emailInput = page.locator(
      'input[name="user[login]"], input[name="user[email]"], #user_login, #user_email'
    );
    await expect(emailInput.first()).toBeVisible({timeout: 10000});
    await emailInput.first().fill(tigrmailInbox);

    const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
    await submitButton.click();

    // Wait for the OTP email to arrive in the Tigrmail inbox
    const message = await waitForTigrmailEmail({
      inbox: tigrmailInbox,
      from: {domain: 'gitlab.com'},
    });

    expect(message).toBeTruthy();
    expect(message.subject).toBeTruthy();

    // Extract the 6-digit OTP from the email body
    const otpMatch = message.body.match(/\b(\d{6})\b/);
    expect(otpMatch).toBeTruthy();
    expect(otpMatch![1]).toMatch(/^\d{6}$/);
  });

  test('extension parses GitLab OTP from Gmail when configured', async ({
    page,
    extensionId,
    serviceWorker,
    context,
  }) => {
    test.skip(!hasGmailCredentials(), 'Gmail credentials needed for extension testing');

    // Seed the extension with Gmail provider
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

    // Use the Gmail test address to trigger GitLab OTP
    await page.goto('https://gitlab.com/users/sign_in');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator(
      'input[name="user[login]"], input[name="user[email]"], #user_login, #user_email'
    );
    await expect(emailInput.first()).toBeVisible({timeout: 10000});
    await emailInput.first().fill(e2eEnv.testGitlabEmail);

    const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
    await submitButton.click();

    // Also verify via gmail-tester that the email arrived
    const emails = await waitForGmailEmail({
      from: 'gitlab.com',
      after: new Date(Date.now() - 2 * 60 * 1000),
      waitTimeSec: 15,
      maxWaitTimeSec: 120,
    });
    expect(emails.length).toBeGreaterThan(0);

    // Open extension popup — it should show the GitLab email
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const gitlabRow = popupPage.locator('tr').filter({hasText: /gitlab/i});
    await expect(gitlabRow.first()).toBeVisible({timeout: 30000});

    const copyButton = gitlabRow.first().getByRole('button', {name: /copy/i});
    await copyButton.click();
    await expect(gitlabRow.first().getByText('Copied!')).toBeVisible({timeout: 5000});
  });
});
