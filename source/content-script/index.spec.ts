import {describe, test, expect, vi} from 'vitest';
import {mockBrowser} from '../__mocks__/webextension-polyfill';

vi.mock('../utils/logger', () => {
  return {
    log: {
      content: {info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn()},
    },
  };
});

await import('./index');

describe('content-script', () => {
  test('registers onMessage listener', () => {
    expect(mockBrowser.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  test('listener returns undefined for any message', async () => {
    const addListener = vi.mocked(mockBrowser.runtime.onMessage.addListener);
    const callback = addListener.mock.calls[0]?.[0];
    expect(callback).toBeDefined();

    const result = await callback?.({type: 'any'});
    expect(result).toBeUndefined();
  });

  test('fills the current page when it receives FILL_OTP', async () => {
    document.body.innerHTML = '<input type="text" name="code" inputmode="numeric" />';

    const addListener = vi.mocked(mockBrowser.runtime.onMessage.addListener);
    const callback = addListener.mock.calls[0]?.[0];
    expect(callback).toBeDefined();

    const result = await callback?.({type: 'FILL_OTP', code: '123456'});
    const input = document.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('123456');
    expect(result).toEqual({success: true});
  });

  test('returns an error when no OTP input is found', async () => {
    document.body.innerHTML = '<div>No code form here</div>';

    const addListener = vi.mocked(mockBrowser.runtime.onMessage.addListener);
    const callback = addListener.mock.calls[0]?.[0];
    expect(callback).toBeDefined();

    const result = await callback?.({type: 'FILL_OTP', code: '123456'});

    expect(result).toEqual({success: false, error: 'OTP input not found'});
  });
});
