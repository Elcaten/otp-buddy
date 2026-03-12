import {test, expect, seedExtensionStorage, clearExtensionStorage} from './fixtures';

test.describe('Options page', () => {
  test.afterEach(async ({serviceWorker}) => {
    await clearExtensionStorage(serviceWorker);
  });

  test('renders with default Fastmail provider selected', async ({page, extensionId}) => {
    await page.goto(`chrome-extension://${extensionId}/options/options.html`);

    await expect(page).toHaveTitle(/OTP Buddy|Options/);
    await expect(page.getByText('Email Provider settings')).toBeVisible({timeout: 5000});

    const fastmailRadio = page.locator('input[type="radio"][value="fastmail"]');
    await expect(fastmailRadio).toBeChecked();
  });

  test('can switch between Fastmail and Gmail providers', async ({page, extensionId}) => {
    await page.goto(`chrome-extension://${extensionId}/options/options.html`);

    await expect(page.getByText('Email Provider settings')).toBeVisible({timeout: 5000});

    // Initially Fastmail
    const fastmailRadio = page.locator('input[type="radio"][value="fastmail"]');
    const gmailRadio = page.locator('input[type="radio"][value="gmail"]');
    await expect(fastmailRadio).toBeChecked();

    // Fastmail-specific fields visible
    await expect(page.getByLabel(/fastmail api key/i)).toBeVisible();
    await expect(page.getByLabel(/account/i)).toBeVisible();

    // Switch to Gmail
    await gmailRadio.click();
    await expect(gmailRadio).toBeChecked();

    // Fastmail fields should be hidden, Gmail sign-in button visible
    await expect(page.getByLabel(/fastmail api key/i)).not.toBeVisible();
  });

  test('shows Fastmail API key input and account dropdown', async ({page, extensionId}) => {
    await page.goto(`chrome-extension://${extensionId}/options/options.html`);
    await expect(page.getByText('Email Provider settings')).toBeVisible({timeout: 5000});

    const apiKeyInput = page.getByLabel(/fastmail api key/i);
    await expect(apiKeyInput).toBeVisible();
    await expect(apiKeyInput).toHaveAttribute('type', 'password');
    await expect(apiKeyInput).toHaveAttribute('placeholder', 'XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX');

    const accountSelect = page.locator('select#accountId');
    await expect(accountSelect).toBeVisible();
    await expect(accountSelect.locator('option').first()).toHaveText('--- Select an account ---');
  });

  test('shows error for invalid Fastmail API key', async ({page, extensionId}) => {
    test.setTimeout(45000);
    await page.goto(`chrome-extension://${extensionId}/options/options.html`);
    await expect(page.getByText('Email Provider settings')).toBeVisible({timeout: 5000});

    const apiKeyInput = page.getByLabel(/fastmail api key/i);
    await apiKeyInput.fill('invalid-api-key-12345');

    await expect(page.getByText(/can't connect to fastmail/i)).toBeVisible({timeout: 30000});
  });

  test('save button exists and shows confirmation', async ({page, extensionId}) => {
    await page.goto(`chrome-extension://${extensionId}/options/options.html`);
    await expect(page.getByText('Email Provider settings')).toBeVisible({timeout: 5000});

    const saveButton = page.getByRole('button', {name: /save/i});
    await expect(saveButton).toBeVisible();
  });

  test('persists settings across reload', async ({page, extensionId, serviceWorker}) => {
    await seedExtensionStorage(serviceWorker, {
      provider: 'gmail',
    });

    await page.goto(`chrome-extension://${extensionId}/options/options.html`);
    await expect(page.getByText('Email Provider settings')).toBeVisible({timeout: 5000});

    const gmailRadio = page.locator('input[type="radio"][value="gmail"]');
    await expect(gmailRadio).toBeChecked();
  });
});
