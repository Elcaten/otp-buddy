import {describe, test, expect, vi, beforeEach, afterEach} from 'vitest';
import {mockBrowser} from '@/__mocks__/webextension-polyfill';

import {tokenStorage} from './token-storage';
import {TokenEndpointResponse} from 'oauth4webapi';

vi.mock('webextension-polyfill', () => {
  return {default: mockBrowser};
});

describe('tokenStorage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(mockBrowser.storage.local.get).mockResolvedValue({});
    vi.mocked(mockBrowser.storage.local.set).mockResolvedValue(undefined);
    vi.mocked(mockBrowser.storage.local.remove).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('get', () => {
    test('returns not_found when storage is empty', async () => {
      const result = await tokenStorage.get();
      expect(result.type).toBe('not_found');
    });

    test('returns not_found when token JSON is invalid', async () => {
      vi.mocked(mockBrowser.storage.local.get).mockResolvedValue({
        gmailToken: 'not-valid-json',
        gmailTokenTimestamp: Date.now(),
      });
      const result = await tokenStorage.get();
      expect(result.type).toBe('not_found');
    });

    test('returns not_found when token has no expires_in', async () => {
      vi.mocked(mockBrowser.storage.local.get).mockResolvedValue({
        gmailToken: JSON.stringify({access_token: 'tok'}),
        gmailTokenTimestamp: Date.now(),
      });
      const result = await tokenStorage.get();
      expect(result.type).toBe('not_found');
    });

    test('returns valid when token expires more than 10 minutes from now', async () => {
      const now = new Date('2024-01-01T00:00:00Z').getTime();
      vi.setSystemTime(now);

      vi.mocked(mockBrowser.storage.local.get).mockResolvedValue({
        gmailToken: JSON.stringify({access_token: 'tok', expires_in: 3600}),
        gmailTokenTimestamp: now,
      });

      const result = await tokenStorage.get();
      expect(result.type).toBe('valid');
      if (result.type === 'valid') {
        expect(result.token.access_token).toBe('tok');
      }
    });

    test('returns expired when token expires within 10 minutes', async () => {
      const now = new Date('2024-01-01T00:00:00Z').getTime();
      vi.setSystemTime(now);

      vi.mocked(mockBrowser.storage.local.get).mockResolvedValue({
        gmailToken: JSON.stringify({access_token: 'tok', expires_in: 300}),
        gmailTokenTimestamp: now,
      });

      const result = await tokenStorage.get();
      expect(result.type).toBe('expired');
      if (result.type === 'expired') {
        expect(result.token.access_token).toBe('tok');
      }
    });

    test('returns expired when token timestamp is in the past and expiry has nearly passed', async () => {
      const now = new Date('2024-01-01T01:00:00Z').getTime();
      vi.setSystemTime(now);

      const issuedAt = new Date('2024-01-01T00:00:00Z').getTime();
      vi.mocked(mockBrowser.storage.local.get).mockResolvedValue({
        gmailToken: JSON.stringify({access_token: 'tok', expires_in: 3600}),
        gmailTokenTimestamp: issuedAt,
      });

      const result = await tokenStorage.get();
      // issued 1 hour ago, expires_in = 3600s → expires exactly now → within 10 min threshold
      expect(result.type).toBe('expired');
    });
  });

  describe('set', () => {
    test('serializes token and saves with current timestamp', async () => {
      const now = new Date('2024-01-01T00:00:00Z').getTime();
      vi.setSystemTime(now);

      const token: TokenEndpointResponse = {access_token: 'tok', expires_in: 3600, token_type: 'bearer'};
      await tokenStorage.set(token);

      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
        gmailToken: JSON.stringify(token),
        gmailTokenTimestamp: now,
      });
    });
  });

  describe('clear', () => {
    test('removes gmailToken and gmailTokenTimestamp from storage', async () => {
      await tokenStorage.clear();
      expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith(['gmailToken', 'gmailTokenTimestamp']);
    });
  });
});
