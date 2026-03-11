import {describe, test, expect, vi, beforeEach} from 'vitest';
import {mockBrowser} from '../__mocks__/webextension-polyfill';

vi.mock('../utils/logger', () => {
  return {
    log: {
      background: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
    },
  };
});

describe('Background', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.mocked(mockBrowser.storage.local.get).mockResolvedValue({
      enableLogging: true,
    });
    vi.mocked(mockBrowser.runtime.sendNativeMessage).mockResolvedValue({
      redirectURL: 'https://auth.example/callback',
    });

    await import('./index');
  });

  test('registers onMessage listener', () => {
    expect(mockBrowser.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  test('handles LogMessage and logs to console', async () => {
    const addListener = vi.mocked(mockBrowser.runtime.onMessage.addListener);
    const callback = addListener.mock.calls[0]?.[0];
    expect(callback).toBeDefined();

    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const result = await callback?.({
      type: 'log',
      level: 'info',
      source: 'popup',
      message: 'test message',
    });

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[OTPBuddy]'),
      'test message'
    );
    consoleSpy.mockRestore();
  });

  test('handles OAuthLaunchMessage and returns redirectURL from native app', async () => {
    const addListener = vi.mocked(mockBrowser.runtime.onMessage.addListener);
    const callback = addListener.mock.calls[0]?.[0];
    expect(callback).toBeDefined();

    const result = await callback?.({
      type: 'OAUTH_LAUNCH',
      authURL: 'https://auth.example/start',
    });

    expect(result).toEqual({redirectURL: 'https://auth.example/callback'});
    expect(mockBrowser.runtime.sendNativeMessage).toHaveBeenCalledWith(
      'com.elcaten.otpbuddy',
      {type: 'oauth', authURL: 'https://auth.example/start'}
    );
  });

  test('handles OAuthLaunchMessage when native app returns error', async () => {
    vi.mocked(mockBrowser.runtime.sendNativeMessage).mockResolvedValue({
      error: 'User cancelled',
    });

    vi.resetModules();
    await import('./index');

    const addListener = vi.mocked(mockBrowser.runtime.onMessage.addListener);
    const callback = addListener.mock.calls[0]?.[0];

    const result = await callback?.({
      type: 'OAUTH_LAUNCH',
      authURL: 'https://auth.example/start',
    });

    expect(result).toEqual({error: 'User cancelled'});
  });

  test('returns undefined for unknown message types', async () => {
    const addListener = vi.mocked(mockBrowser.runtime.onMessage.addListener);
    const callback = addListener.mock.calls[0]?.[0];

    const result = await callback?.({type: 'unknown'});

    expect(result).toBeUndefined();
  });
});
