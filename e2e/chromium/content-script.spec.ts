import {test, expect, clearExtensionStorage} from './fixtures';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import http from 'node:http';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let server: http.Server;
let serverPort: number;

test.describe('Content script: OTP filling', () => {
  test.beforeAll(async () => {
    server = http.createServer((req, res) => {
      const filePath = path.join(__dirname, 'test-pages', req.url === '/' ? 'index.html' : req.url!);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        serverPort = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  test.afterAll(async () => {
    server?.close();
  });

  test.afterEach(async ({serviceWorker}) => {
    await clearExtensionStorage(serviceWorker);
  });

  /**
   * Send a FILL_OTP message to a content tab via the service worker.
   *
   * Without the `tabs` permission, chrome.tabs.query can't filter by URL.
   * Instead, we query all tabs and send the message to each non-extension tab,
   * returning the first successful response.
   */
  async function sendFillOtp(
    serviceWorker: import('@playwright/test').Worker,
    code: string
  ): Promise<{success: boolean; error?: string}> {
    const result = await Promise.race([
      serviceWorker.evaluate(async (otpCode: string) => {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (!tab.id || tab.url?.startsWith('chrome-extension://')) continue;
          try {
            const response = await chrome.tabs.sendMessage(tab.id, {
              type: 'FILL_OTP',
              code: otpCode,
            });
            if (response) return response as {success: boolean; error?: string};
          } catch {
            // Tab doesn't have a content script listener, skip
          }
        }
        return {success: false, error: 'No content script responded'};
      }, code),
      new Promise<{success: boolean; error: string}>((resolve) =>
        setTimeout(() => resolve({success: false, error: 'sendFillOtp timed out'}), 10000)
      ),
    ]);
    return result;
  }

  test.describe('Single input', () => {
    test('fills a single OTP input via content script message', async ({page, serviceWorker}) => {
      await page.goto(`http://localhost:${serverPort}/otp-single-input.html`);
      await expect(page.locator('#otp')).toBeVisible();
      await page.waitForTimeout(1500);

      const fillResult = await sendFillOtp(serviceWorker, '123456');
      expect(fillResult).toEqual({success: true});

      const inputValue = await page.locator('#otp').inputValue();
      expect(inputValue).toBe('123456');

      const resultDiv = page.locator('#result');
      await expect(resultDiv).toBeVisible({timeout: 3000});
      await expect(resultDiv).toHaveAttribute('data-submitted-code', '123456');
    });
  });

  test.describe('Multi input', () => {
    test('fills multiple OTP inputs (one digit each) via content script message', async ({
      page,
      serviceWorker,
    }) => {
      await page.goto(`http://localhost:${serverPort}/otp-multi-input.html`);
      const inputs = page.locator('#otpContainer input');
      await expect(inputs.first()).toBeVisible();
      expect(await inputs.count()).toBe(6);
      await page.waitForTimeout(1500);

      const fillResult = await sendFillOtp(serviceWorker, '789012');
      expect(fillResult).toEqual({success: true});

      for (let i = 0; i < 6; i++) {
        const value = await inputs.nth(i).inputValue();
        expect(value).toBe('789012'[i]);
      }

      const resultDiv = page.locator('#result');
      await expect(resultDiv).toBeVisible({timeout: 3000});
      await expect(resultDiv).toHaveAttribute('data-submitted-code', '789012');
    });

    test('returns error when code length mismatches input count', async ({page, serviceWorker}) => {
      await page.goto(`http://localhost:${serverPort}/otp-multi-input.html`);
      await expect(page.locator('#otpContainer input').first()).toBeVisible();
      await page.waitForTimeout(1500);

      const fillResult = await sendFillOtp(serviceWorker, '1234');
      expect(fillResult).toEqual({success: false, error: 'OTP inputs count mismatch'});
    });
  });

  test('returns error when no OTP input found on page', async ({page, serviceWorker}) => {
    await page.goto(`http://localhost:${serverPort}/otp-single-input.html`);
    await expect(page.locator('#otp')).toBeVisible();
    await page.evaluate(() => {
      document.querySelectorAll('input').forEach((el) => el.remove());
    });
    await page.waitForTimeout(1500);

    const fillResult = await sendFillOtp(serviceWorker, '123456');
    expect(fillResult).toEqual({success: false, error: 'OTP input not found'});
  });
});
