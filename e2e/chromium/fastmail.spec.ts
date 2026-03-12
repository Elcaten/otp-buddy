import {test, expect, seedExtensionStorage, clearExtensionStorage} from './fixtures';
import {sendTestEmailToFastmail} from './helpers/fastmail-helper';
import {e2eEnv, hasFastmailCredentials} from './helpers/env';

test.describe('Fastmail integration', () => {
  test.beforeEach(async () => {
    test.skip(!hasFastmailCredentials(), 'Fastmail credentials not available');
  });

  test.afterEach(async ({serviceWorker}) => {
    await clearExtensionStorage(serviceWorker);
  });

  test.describe('Options page: Fastmail setup', () => {
    test('entering a valid API key loads accounts', async ({page, extensionId}) => {
      await page.goto(`chrome-extension://${extensionId}/options/options.html`);
      await expect(page.getByText('Email Provider settings')).toBeVisible({timeout: 5000});

      const apiKeyInput = page.getByLabel(/fastmail api key/i);
      await apiKeyInput.fill(e2eEnv.fastmailApiKey);

      // Wait for accounts to load (the spinner should appear then disappear)
      const accountSelect = page.locator('select#accountId');
      await expect(accountSelect).toBeEnabled({timeout: 30000});

      // Should have at least one real account option beyond the placeholder
      const options = accountSelect.locator('option');
      expect(await options.count()).toBeGreaterThan(1);
    });

    test('full setup flow: enter key, select account, save', async ({
      page,
      extensionId,
      serviceWorker,
    }) => {
      await page.goto(`chrome-extension://${extensionId}/options/options.html`);
      await expect(page.getByText('Email Provider settings')).toBeVisible({timeout: 5000});

      // Enter API key
      const apiKeyInput = page.getByLabel(/fastmail api key/i);
      await apiKeyInput.fill(e2eEnv.fastmailApiKey);

      // Wait for accounts to load
      const accountSelect = page.locator('select#accountId');
      await expect(accountSelect).toBeEnabled({timeout: 30000});

      // Select the test account
      await accountSelect.selectOption(e2eEnv.fastmailAccountId);

      // Save
      const saveButton = page.getByRole('button', {name: /save/i});
      await saveButton.click();

      // Verify saved confirmation appears
      await expect(page.getByText('✅')).toBeVisible({timeout: 5000});

      // Verify storage was actually set
      const stored = await serviceWorker.evaluate(async () =>
        chrome.storage.local.get(['provider', 'fastmailApiKey', 'fastmailAccountId'])
      );
      expect(stored).toMatchObject({
        provider: 'fastmail',
        fastmailApiKey: e2eEnv.fastmailApiKey,
        fastmailAccountId: e2eEnv.fastmailAccountId,
      });
    });
  });

  test.describe('Popup: Fastmail email fetch', () => {
    test('shows emails table when Fastmail is configured', async ({
      page,
      extensionId,
      serviceWorker,
    }) => {
      await seedExtensionStorage(serviceWorker, {
        provider: 'fastmail',
        fastmailApiKey: e2eEnv.fastmailApiKey,
        fastmailAccountId: e2eEnv.fastmailAccountId,
      });

      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      // Should show either emails table or "No recent messages"
      const emailsTable = page.locator('table');
      const noMessages = page.getByText(/no recent messages/i);
      await expect(emailsTable.or(noMessages)).toBeVisible({timeout: 30000});
    });

    test('shows a sent test email in the popup', async ({
      page,
      extensionId,
      serviceWorker,
    }) => {
      // Send a test email first
      const testSubject = `E2E Test OTP ${Date.now()} code 845192`;
      await sendTestEmailToFastmail({
        subject: testSubject,
        htmlBody: `<html><body><p>Your verification code is <span>845192</span></p></body></html>`,
        fromName: 'E2E Test Sender',
      });

      // Wait a moment for delivery
      await page.waitForTimeout(5000);

      // Configure extension and open popup
      await seedExtensionStorage(serviceWorker, {
        provider: 'fastmail',
        fastmailApiKey: e2eEnv.fastmailApiKey,
        fastmailAccountId: e2eEnv.fastmailAccountId,
      });

      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      // Should show the test email in the table
      const emailRow = page.getByText(testSubject);
      await expect(emailRow).toBeVisible({timeout: 30000});
    });
  });

  test.describe('Full flow: Fastmail fetch → Parse → Copy OTP', () => {
    test('copies OTP from a Fastmail email', async ({page, extensionId, serviceWorker}) => {
      const otp = '692471';
      const testSubject = `E2E Verify ${Date.now()} code ${otp}`;
      await sendTestEmailToFastmail({
        subject: testSubject,
        htmlBody: `<html><body><div>${otp}</div></body></html>`,
      });

      await page.waitForTimeout(5000);

      await seedExtensionStorage(serviceWorker, {
        provider: 'fastmail',
        fastmailApiKey: e2eEnv.fastmailApiKey,
        fastmailAccountId: e2eEnv.fastmailAccountId,
      });

      await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      const emailRow = page.getByText(testSubject);
      await expect(emailRow).toBeVisible({timeout: 30000});

      // Find the row's Copy button
      const row = page.locator('tr', {has: emailRow});
      const copyButton = row.getByRole('button', {name: /copy/i});
      await copyButton.click();

      // Button text should change to "Copied!"
      await expect(row.getByText('Copied!')).toBeVisible({timeout: 5000});
    });
  });

  test.describe('Full flow: Fastmail fetch → Parse → Fill OTP', () => {
    test('fills OTP from Fastmail email into a test page', async ({
      page,
      extensionId,
      serviceWorker,
      context,
    }) => {
      const otp = '538197';
      const testSubject = `E2E Fill ${Date.now()} code ${otp}`;
      await sendTestEmailToFastmail({
        subject: testSubject,
        htmlBody: `<html><body><div>${otp}</div></body></html>`,
      });

      await page.waitForTimeout(5000);

      await seedExtensionStorage(serviceWorker, {
        provider: 'fastmail',
        fastmailApiKey: e2eEnv.fastmailApiKey,
        fastmailAccountId: e2eEnv.fastmailAccountId,
      });

      // Open the test OTP page in a tab
      const otpPage = await context.newPage();
      const testPageUrl = `file://${new URL('./test-pages/otp-single-input.html', import.meta.url).pathname}`;
      await otpPage.goto(testPageUrl);
      await expect(otpPage.locator('#otp')).toBeVisible();

      // Bring OTP page to focus so it becomes the "active tab"
      await otpPage.bringToFront();

      // Open popup
      const popupPage = await context.newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);

      const emailRow = popupPage.getByText(testSubject);
      await expect(emailRow).toBeVisible({timeout: 30000});

      // Click Fill
      const row = popupPage.locator('tr', {has: emailRow});
      const fillButton = row.getByRole('button', {name: /^fill$/i});
      await fillButton.click();

      // Button should show success
      await expect(row.getByText('Filled!')).toBeVisible({timeout: 5000});

      // Verify the OTP page input was filled
      const inputValue = await otpPage.locator('#otp').inputValue();
      expect(inputValue).toBe(otp);
    });
  });
});
