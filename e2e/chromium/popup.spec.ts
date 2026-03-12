import {test, expect, seedExtensionStorage, clearExtensionStorage} from './fixtures';

test.describe('Popup', () => {
  test.afterEach(async ({serviceWorker}) => {
    await clearExtensionStorage(serviceWorker);
  });

  test('shows setup prompt when no provider configured', async ({page, extensionId}) => {
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    await expect(page.getByRole('button', {name: /extension settings/i})).toBeVisible({timeout: 5000});
    await expect(page.getByText(/please set up your email provider/i)).toBeVisible();
  });

  test('settings button opens the options page', async ({page, extensionId}) => {
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const settingsButton = page.getByRole('button', {name: /extension settings/i});
    await expect(settingsButton).toBeVisible({timeout: 5000});

    const [optionsPage] = await Promise.all([
      page.context().waitForEvent('page'),
      settingsButton.click(),
    ]);
    await expect(optionsPage).toHaveURL(/options\/options\.html/);
  });

  test('shows setup prompt when fastmail selected but no API key', async ({
    page,
    extensionId,
    serviceWorker,
  }) => {
    await seedExtensionStorage(serviceWorker, {
      provider: 'fastmail',
      fastmailApiKey: '',
      fastmailAccountId: '',
    });

    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await expect(page.getByText(/please set up your email provider/i)).toBeVisible({timeout: 5000});
  });

  test('shows setup prompt when fastmail has key but no account', async ({
    page,
    extensionId,
    serviceWorker,
  }) => {
    await seedExtensionStorage(serviceWorker, {
      provider: 'fastmail',
      fastmailApiKey: 'some-key',
      fastmailAccountId: '',
    });

    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await expect(page.getByText(/please set up your email provider/i)).toBeVisible({timeout: 5000});
  });
});
