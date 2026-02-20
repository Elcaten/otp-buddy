/**
 * Mock for webextension-polyfill for use in integration tests.
 *
 * Usage in tests:
 *   import { mockBrowser } from '@/__mocks__/webextension-polyfill';
 *   vi.mock('webextension-polyfill', () => ({ default: mockBrowser }));
 */

import {vi} from 'vitest';
import type browser from 'webextension-polyfill';

const createMockListener = (): Partial<typeof browser.runtime.onMessage> => {
  return {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
};

const createMockStorage = (): DeepPartial<typeof browser.storage> => {
  return {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    },
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    },
  };
};

export const mockBrowser = {
  runtime: {
    onMessage: createMockListener(),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    sendNativeMessage: vi.fn().mockResolvedValue({}),
    openOptionsPage: vi.fn().mockResolvedValue(undefined),
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
  } satisfies DeepPartial<typeof browser.runtime>,
  storage: createMockStorage(),
  identity: {
    getRedirectURL: vi.fn().mockReturnValue('https://mock-redirect.example/'),
    launchWebAuthFlow: vi
      .fn()
      .mockResolvedValue('https://mock-auth-callback.example/'),
  } satisfies Partial<typeof browser.identity>,
  tabs: {
    query: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn().mockResolvedValue(undefined),
  } satisfies Partial<typeof browser.tabs>,
};

type DeepPartial<T> = {
  [K in keyof T]?: DeepPartial<T[K]>;
};
