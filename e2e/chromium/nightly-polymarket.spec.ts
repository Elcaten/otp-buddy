import {test, expect, seedExtensionStorage, clearExtensionStorage} from './fixtures';
import {waitForGmailEmail} from './helpers/gmail-helper';
import {getFastmailMessages} from './helpers/fastmail-helper';
import {e2eEnv, hasGmailCredentials, hasFastmailCredentials, hasNightlyCredentials} from './helpers/env';

/**
 * Nightly E2E test: Polymarket login OTP flow.
 *
 * This test:
 * 1. Navigates to Polymarket login page
 * 2. Enters the test email to trigger a magic code email
 * 3. Waits for the OTP email to arrive (via gmail-tester or Fastmail JMAP)
 * 4. Verifies the extension popup shows the email and can extract the code
 *
 * Polymarket sends a 6-digit code in the email subject.
 *
 * Requires: TEST_POLYMARKET_EMAIL + either Gmail or Fastmail credentials.
 */
test.describe('Nightly: Polymarket OTP flow', () => {
  test.beforeEach(async () => {
    test.skip(
      !hasNightlyCredentials() || !e2eEnv.testPolymarketEmail,
      'Polymarket nightly credentials not available'
    );
  });

  test.afterEach(async ({serviceWorker}) => {
    await clearExtensionStorage(serviceWorker);
  });

  test('receives and extracts Polymarket OTP code via extension', async ({
    page,
    extensionId,
    serviceWorker,
    context,
  }) => {
    const useGmail = hasGmailCredentials();
    const useFastmail = hasFastmailCredentials();
    test.skip(!useGmail && !useFastmail, 'Need either Gmail or Fastmail credentials');

    // Seed the extension
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

    // Navigate to Polymarket login
    await page.goto('https://polymarket.com');
    await page.waitForLoadState('networkidle');

    // Look for a login/sign-in button
    const loginButton = page.getByRole('button', {name: /log in|sign in|sign up/i}).first();
    await expect(loginButton).toBeVisible({timeout: 15000});
    await loginButton.click();

    // Enter email in the login modal
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await expect(emailInput).toBeVisible({timeout: 10000});
    await emailInput.fill(e2eEnv.testPolymarketEmail);

    // Submit
    const continueButton = page
      .getByRole('button', {name: /continue|submit|send|log in|sign in/i})
      .first();
    await continueButton.click();

    // Wait for the OTP email
    let otpFromEmail: string | undefined;

    if (useGmail) {
      const emails = await waitForGmailEmail({
        from: 'Polymarket',
        after: timestampBefore,
        waitTimeSec: 15,
        maxWaitTimeSec: 120,
      });

      expect(emails.length).toBeGreaterThan(0);
      // Polymarket puts the OTP in the subject line
      const subject = emails[0]?.subject ?? '';
      const otpMatch = subject.match(/\b(\d{6})\b/);
      otpFromEmail = otpMatch?.[1];
    } else {
      let attempts = 0;
      while (attempts < 12) {
        await page.waitForTimeout(10000);
        const messages = await getFastmailMessages({afterMinutes: 5});
        const polyEmail = messages.find(
          (m) =>
            m.from.toLowerCase().includes('polymarket') ||
            m.subject.toLowerCase().includes('polymarket')
        );
        if (polyEmail) {
          const otpMatch = polyEmail.subject.match(/\b(\d{6})\b/);
          otpFromEmail = otpMatch?.[1];
          break;
        }
        attempts++;
      }
    }

    expect(otpFromEmail).toBeTruthy();
    expect(otpFromEmail).toMatch(/^\d{6}$/);

    // Verify extension popup shows the Polymarket email
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const polymarketRow = popupPage.locator('tr').filter({hasText: /polymarket/i});
    await expect(polymarketRow.first()).toBeVisible({timeout: 30000});

    // Copy OTP via extension
    const copyButton = polymarketRow.first().getByRole('button', {name: /copy/i});
    await copyButton.click();
    await expect(polymarketRow.first().getByText('Copied!')).toBeVisible({timeout: 5000});
  });
});
