import {test as base, chromium, type BrowserContext, type Worker} from '@playwright/test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pathToExtension = path.join(__dirname, '..', '..', 'extension', 'chrome');

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
  serviceWorker: Worker;
}>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: true,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  serviceWorker: async ({context}, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) {
      sw = await context.waitForEvent('serviceworker', {timeout: 10000});
    }
    await use(sw);
  },
  extensionId: async ({serviceWorker}, use) => {
    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId!);
  },
});

export const expect = test.expect;

/**
 * Pre-seed extension storage via the service worker.
 * This allows tests to configure the extension without going through the UI.
 */
export async function seedExtensionStorage(
  serviceWorker: Worker,
  data: Record<string, unknown>
): Promise<void> {
  await serviceWorker.evaluate(async (storageData) => {
    await chrome.storage.local.set(storageData);
  }, data);
}

/**
 * Clear all extension storage. Silently ignores errors (e.g., if the
 * service worker has been terminated between test body and afterEach).
 */
export async function clearExtensionStorage(serviceWorker: Worker): Promise<void> {
  try {
    await Promise.race([
      serviceWorker.evaluate(async () => {
        await chrome.storage.local.clear();
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('clearStorage timeout')), 5000)),
    ]);
  } catch {
    // Service worker may have been terminated; storage will be fresh on next context anyway
  }
}
