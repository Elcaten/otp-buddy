import {test, expect, seedExtensionStorage, clearExtensionStorage} from './fixtures';
import {createTigrmailInbox, waitForTigrmailEmail} from './helpers/tigrmail-helper';
import {waitForGmailEmail} from './helpers/gmail-helper';
import {e2eEnv, hasGmailCredentials, hasTigrmailCredentials, hasNightlyCredentials} from './helpers/env';

/**
 * Nightly E2E test: Polymarket login OTP flow.
 *
 * This test:
 * 1. Creates a Tigrmail disposable inbox
 * 2. Navigates to Polymarket login page
 * 3. Enters the disposable email to trigger a magic code email
 * 4. Waits for the OTP email via Tigrmail API
 * 5. Verifies the 6-digit code can be extracted from the subject
 *
 * Polymarket sends a 6-digit code in the email subject.
 *
 * Requires: TIGRMAIL_TOKEN.
 */
test.describe('Nightly: Polymarket OTP flow', () => {
  test.beforeEach(async () => {
    test.skip(!hasNightlyCredentials(), 'Nightly credentials not available');
    test.skip(!hasTigrmailCredentials(), 'Tigrmail token not available');
  });

  test.afterEach(async ({serviceWorker}) => {
    await clearExtensionStorage(serviceWorker);
  });

  test('receives Polymarket OTP code via Tigrmail inbox', async ({page}) => {
    const tigrmailInbox = await createTigrmailInbox();
    expect(tigrmailInbox).toContain('@');

    // Navigate to Polymarket
    await page.goto('https://polymarket.com');
    await page.waitForLoadState('networkidle');

    const loginButton = page.getByRole('button', {name: /log in|sign in|sign up/i}).first();
    await expect(loginButton).toBeVisible({timeout: 15000});
    await loginButton.click();

    // Enter the Tigrmail email in the login modal
    const emailInput = page
      .locator('input[type="email"], input[name="email"], input[placeholder*="email" i]')
      .first();
    await expect(emailInput).toBeVisible({timeout: 10000});
    await emailInput.fill(tigrmailInbox);

    const continueButton = page
      .getByRole('button', {name: /continue|submit|send|log in|sign in/i})
      .first();
    await continueButton.click();

    // Wait for the OTP email via Tigrmail
    const message = await waitForTigrmailEmail({
      inbox: tigrmailInbox,
      from: {domain: 'polymarket.com'},
    });

    expect(message).toBeTruthy();

    // Polymarket puts the OTP in the subject line
    const otpMatch = message.subject.match(/\b(\d{6})\b/);
    expect(otpMatch).toBeTruthy();
    expect(otpMatch![1]).toMatch(/^\d{6}$/);
  });

  test('extension parses Polymarket OTP from Gmail when configured', async ({
    page,
    extensionId,
    serviceWorker,
    context,
  }) => {
    test.skip(!hasGmailCredentials(), 'Gmail credentials needed for extension testing');

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

    await page.goto('https://polymarket.com');
    await page.waitForLoadState('networkidle');

    const loginButton = page.getByRole('button', {name: /log in|sign in|sign up/i}).first();
    await expect(loginButton).toBeVisible({timeout: 15000});
    await loginButton.click();

    const emailInput = page
      .locator('input[type="email"], input[name="email"], input[placeholder*="email" i]')
      .first();
    await expect(emailInput).toBeVisible({timeout: 10000});
    await emailInput.fill(e2eEnv.testPolymarketEmail);

    const continueButton = page
      .getByRole('button', {name: /continue|submit|send|log in|sign in/i})
      .first();
    await continueButton.click();

    // Verify via gmail-tester
    const emails = await waitForGmailEmail({
      from: 'Polymarket',
      after: new Date(Date.now() - 2 * 60 * 1000),
      waitTimeSec: 15,
      maxWaitTimeSec: 120,
    });
    expect(emails.length).toBeGreaterThan(0);

    // Open extension popup
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const polymarketRow = popupPage.locator('tr').filter({hasText: /polymarket/i});
    await expect(polymarketRow.first()).toBeVisible({timeout: 30000});

    const copyButton = polymarketRow.first().getByRole('button', {name: /copy/i});
    await copyButton.click();
    await expect(polymarketRow.first().getByText('Copied!')).toBeVisible({timeout: 5000});
  });
});
