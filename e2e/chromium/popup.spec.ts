import {test, expect} from './fixtures';

test.describe('Popup', () => {
  test('opens and shows setup prompt when no storage configured', async ({page, extensionId}) => {
    await page.goto(`chrome-extension://${extensionId}/Popup/popup.html`);

    await expect(page.getByRole('button', {name: /extension settings/i})).toBeVisible({timeout: 5000});
    await expect(page.getByText(/please set up your email provider/i)).toBeVisible();
  });

  test('has link to open options page', async ({page, extensionId}) => {
    await page.goto(`chrome-extension://${extensionId}/Popup/popup.html`);

    const settingsButton = page.getByRole('button', {
      name: /extension settings/i,
    });
    await expect(settingsButton).toBeVisible({timeout: 5000});

    const [optionsPage] = await Promise.all([page.context().waitForEvent('page'), settingsButton.click()]);

    await expect(optionsPage).toHaveURL(/Options\/options\.html/);
  });
});
