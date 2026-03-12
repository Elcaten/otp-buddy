import {test, expect, seedExtensionStorage, clearExtensionStorage} from './fixtures';
import {sendTestEmailToGmail, waitForGmailEmail} from './helpers/gmail-helper';
import {e2eEnv, hasGmailCredentials} from './helpers/env';

test.describe('Gmail integration', () => {
  test.beforeEach(async () => {
    test.skip(!hasGmailCredentials(), 'Gmail credentials not available');
  });

  test.afterEach(async ({serviceWorker}) => {
    await clearExtensionStorage(serviceWorker);
  });

  /**
   * Pre-seed extension storage with a Gmail refresh token.
   * The extension will detect the expired token and use the refresh_token
   * to get a fresh access_token automatically.
   */
  async function seedGmailAuth(serviceWorker: import('@playwright/test').Worker) {
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
  }

  test.describe('Popup: Gmail email fetch', () => {
    test('shows emails table when Gmail is configured with refresh token', async ({
      page,
      extensionId,
      serviceWorker,
    }) => {
      await seedGmailAuth(serviceWorker);

      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      // Should show either emails table or "No recent messages"
      const emailsTable = page.locator('table');
      const noMessages = page.getByText(/no recent messages/i);
      await expect(emailsTable.or(noMessages)).toBeVisible({timeout: 30000});
    });

    test('shows a sent test email in the popup', async ({page, extensionId, serviceWorker}) => {
      const testSubject = `E2E Gmail Test ${Date.now()} code 491052`;
      await sendTestEmailToGmail({
        subject: testSubject,
        htmlBody: `<html><body><p>Your code is <span>491052</span></p></body></html>`,
      });

      // Wait for email delivery
      await page.waitForTimeout(5000);

      await seedGmailAuth(serviceWorker);

      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      const emailRow = page.getByText(testSubject);
      await expect(emailRow).toBeVisible({timeout: 30000});
    });
  });

  test.describe('Full flow: Gmail fetch → Parse → Copy OTP', () => {
    test('copies OTP from a Gmail email', async ({page, extensionId, serviceWorker}) => {
      const otp = '783261';
      const testSubject = `E2E Gmail Verify ${Date.now()} code ${otp}`;
      await sendTestEmailToGmail({
        subject: testSubject,
        htmlBody: `<html><body><div>${otp}</div></body></html>`,
      });

      await page.waitForTimeout(5000);

      await seedGmailAuth(serviceWorker);

      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      const emailRow = page.getByText(testSubject);
      await expect(emailRow).toBeVisible({timeout: 30000});

      const row = page.locator('tr', {has: emailRow});
      const copyButton = row.getByRole('button', {name: /copy/i});
      await copyButton.click();

      await expect(row.getByText('Copied!')).toBeVisible({timeout: 5000});
    });
  });

  test.describe('Full flow: Gmail fetch → Parse → Fill OTP', () => {
    test('fills OTP from Gmail email into a test page', async ({
      page,
      extensionId,
      serviceWorker,
      context,
    }) => {
      const otp = '204856';
      const testSubject = `E2E Gmail Fill ${Date.now()} code ${otp}`;
      await sendTestEmailToGmail({
        subject: testSubject,
        htmlBody: `<html><body><div>${otp}</div></body></html>`,
      });

      await page.waitForTimeout(5000);

      await seedGmailAuth(serviceWorker);

      // Open a test OTP page
      const otpPage = await context.newPage();
      const testPageUrl = `file://${new URL('./test-pages/otp-single-input.html', import.meta.url).pathname}`;
      await otpPage.goto(testPageUrl);
      await expect(otpPage.locator('#otp')).toBeVisible();
      await otpPage.bringToFront();

      // Open popup
      const popupPage = await context.newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      const emailRow = popupPage.getByText(testSubject);
      await expect(emailRow).toBeVisible({timeout: 30000});

      const row = popupPage.locator('tr', {has: emailRow});
      const fillButton = row.getByRole('button', {name: /^fill$/i});
      await fillButton.click();

      await expect(row.getByText('Filled!')).toBeVisible({timeout: 5000});

      const inputValue = await otpPage.locator('#otp').inputValue();
      expect(inputValue).toBe(otp);
    });
  });

  test.describe('gmail-tester: independent inbox verification', () => {
    test('gmail-tester can read a sent test email', async () => {
      const testSubject = `E2E Tester Check ${Date.now()}`;
      await sendTestEmailToGmail({
        subject: testSubject,
        htmlBody: `<html><body><p>gmail-tester verification</p></body></html>`,
      });

      const emails = await waitForGmailEmail({
        subject: testSubject,
        after: new Date(Date.now() - 5 * 60 * 1000),
        waitTimeSec: 10,
        maxWaitTimeSec: 90,
      });

      expect(emails.length).toBeGreaterThan(0);
      expect(emails[0]?.subject).toContain(testSubject);
    });
  });
});
