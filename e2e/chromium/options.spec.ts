import {test, expect} from './fixtures';

test.describe('Options page', () => {
  test('opens and renders', async ({page, extensionId}) => {
    await page.goto(`chrome-extension://${extensionId}/options/options.html`);

    await expect(page).toHaveTitle(/OTP Buddy|Options/);
  });
});
