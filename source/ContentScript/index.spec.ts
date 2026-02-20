import {describe, test, expect, vi} from 'vitest';
import {mockBrowser} from '../__mocks__/webextension-polyfill';

vi.mock('webextension-polyfill', () => {
  return {default: mockBrowser};
});
vi.mock('../utils/logger', () => {
  return {
    log: {
      content: {info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn()},
    },
  };
});

await import('./index');

describe('ContentScript', () => {
  test('registers onMessage listener', () => {
    expect(mockBrowser.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  test('listener returns undefined for any message', () => {
    const addListener = vi.mocked(mockBrowser.runtime.onMessage.addListener);
    const callback = addListener.mock.calls[0]?.[0];
    expect(callback).toBeDefined();

    const result = callback?.({type: 'any'});
    expect(result).toBeUndefined();
  });
});
