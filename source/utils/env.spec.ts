import {describe, test, expect, vi, beforeEach, afterEach} from 'vitest';

describe('env', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('exports the three required env var values', async () => {
    vi.stubEnv('VITE_OTP_BUDDY_SAFARI_CLIENT_ID', 'safari-id');
    vi.stubEnv('VITE_OTP_BUDDY_WEB_CLIENT_ID', 'web-id');
    vi.stubEnv('VITE_OTP_BUDDY_WEB_CLIENT_SECRET', 'web-secret');

    const {env} = await import('./env');

    expect(env.OTP_BUDDY_SAFARI_CLIENT_ID).toBe('safari-id');
    expect(env.OTP_BUDDY_WEB_CLIENT_ID).toBe('web-id');
    expect(env.OTP_BUDDY_WEB_CLIENT_SECRET).toBe('web-secret');
  });

  test('throws when VITE_OTP_BUDDY_SAFARI_CLIENT_ID is missing', async () => {
    vi.stubEnv('VITE_OTP_BUDDY_SAFARI_CLIENT_ID', '');
    vi.stubEnv('VITE_OTP_BUDDY_WEB_CLIENT_ID', 'web-id');
    vi.stubEnv('VITE_OTP_BUDDY_WEB_CLIENT_SECRET', 'web-secret');

    await expect(import('./env')).rejects.toThrow(
      'VITE_OTP_BUDDY_SAFARI_CLIENT_ID'
    );
  });

  test('throws when VITE_OTP_BUDDY_WEB_CLIENT_ID is missing', async () => {
    vi.stubEnv('VITE_OTP_BUDDY_SAFARI_CLIENT_ID', 'safari-id');
    vi.stubEnv('VITE_OTP_BUDDY_WEB_CLIENT_ID', '');
    vi.stubEnv('VITE_OTP_BUDDY_WEB_CLIENT_SECRET', 'web-secret');

    await expect(import('./env')).rejects.toThrow(
      'VITE_OTP_BUDDY_WEB_CLIENT_ID'
    );
  });

  test('throws when VITE_OTP_BUDDY_WEB_CLIENT_SECRET is missing', async () => {
    vi.stubEnv('VITE_OTP_BUDDY_SAFARI_CLIENT_ID', 'safari-id');
    vi.stubEnv('VITE_OTP_BUDDY_WEB_CLIENT_ID', 'web-id');
    vi.stubEnv('VITE_OTP_BUDDY_WEB_CLIENT_SECRET', '');

    await expect(import('./env')).rejects.toThrow(
      'VITE_OTP_BUDDY_WEB_CLIENT_SECRET'
    );
  });
});
