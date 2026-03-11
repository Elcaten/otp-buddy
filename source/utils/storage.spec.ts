import {describe, test, expect, vi, beforeEach} from 'vitest';
import {mockBrowser} from '../__mocks__/webextension-polyfill';
import {getStorage, setStorage, getAllStorage, clearStorage} from './storage';

describe('storage utils', () => {
  beforeEach(() => {
    vi.mocked(mockBrowser.storage.local.get).mockResolvedValue({});
    vi.mocked(mockBrowser.storage.local.set).mockResolvedValue(undefined);
  });

  describe('getStorage', () => {
    test('returns values from browser.storage with defaults for missing keys', async () => {
      vi.mocked(mockBrowser.storage.local.get).mockResolvedValue({
        provider: 'gmail',
        enableLogging: false,
      });

      const result = await getStorage(['provider', 'enableLogging', 'visitCount']);

      expect(result).toMatchObject({
        provider: 'gmail',
        enableLogging: false,
        visitCount: 0,
      });
      expect(mockBrowser.storage.local.get).toHaveBeenCalledWith(['provider', 'enableLogging', 'visitCount']);
    });
  });

  describe('setStorage', () => {
    test('calls browser.storage.local.set with items', async () => {
      await setStorage({provider: 'fastmail', enableLogging: true});

      expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
        provider: 'fastmail',
        enableLogging: true,
      });
    });
  });

  describe('getAllStorage', () => {
    test('returns merged defaultStorage and stored values', async () => {
      vi.mocked(mockBrowser.storage.local.get).mockResolvedValue({
        provider: 'gmail',
      });

      const result = await getAllStorage();

      expect(result).toMatchObject({
        provider: 'gmail',
        fastmailApiKey: '',
        enableLogging: true,
      });
      expect(mockBrowser.storage.local.get).toHaveBeenCalledWith(null);
    });
  });

  describe('clearStorage', () => {
    test('calls browser.storage.local.remove with the given keys', async () => {
      vi.mocked(mockBrowser.storage.local.remove).mockResolvedValue(undefined);

      await clearStorage(['gmailToken', 'gmailTokenTimestamp']);

      expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith([
        'gmailToken',
        'gmailTokenTimestamp',
      ]);
    });

    test('accepts a single key', async () => {
      vi.mocked(mockBrowser.storage.local.remove).mockResolvedValue(undefined);

      await clearStorage('provider');

      expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith('provider');
    });
  });
});
