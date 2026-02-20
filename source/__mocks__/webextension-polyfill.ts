/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * Mock for webextension-polyfill for use in integration tests.
 *
 * Usage in tests:
 *   import { mockBrowser } from '@/__mocks__/webextension-polyfill';
 *   vi.mock('webextension-polyfill', () => ({ default: mockBrowser }));
 */

import {vi} from 'vitest';
import type browser from 'webextension-polyfill';

const createMockListener = () =>
  ({
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }) satisfies Partial<Record<keyof typeof browser.runtime.onMessage, unknown>>;

const createMockStorage = () => {
  return {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    } satisfies Partial<Record<keyof typeof browser.storage.local, unknown>>,
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    } satisfies Partial<Record<keyof typeof browser.storage.sync, unknown>>,
  };
};

export const mockBrowser = {
  runtime: {
    onMessage: createMockListener(),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    sendNativeMessage: vi.fn().mockResolvedValue({}),
    openOptionsPage: vi.fn().mockResolvedValue(undefined),
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
  } satisfies Partial<Record<keyof typeof browser.runtime, unknown>>,
  storage: createMockStorage(),
  identity: {
    getRedirectURL: vi.fn().mockReturnValue('https://mock-redirect.example/'),
    launchWebAuthFlow: vi
      .fn()
      .mockResolvedValue('https://mock-auth-callback.example/'),
  } satisfies Partial<Record<keyof typeof browser.identity, unknown>>,
  tabs: {
    query: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn().mockResolvedValue(undefined),
  } satisfies Partial<Record<keyof typeof browser.tabs, unknown>>,
};
