import {describe, test, expect, vi, beforeEach} from 'vitest';
import {mockBrowser} from '@/__mocks__/webextension-polyfill';

import {GmailEmailFetcher} from './gmail-fetcher';
import * as PostalMime from 'postal-mime';

vi.mock('webextension-polyfill', () => {
  return {default: mockBrowser};
});

vi.mock('postal-mime', () => {
  return {
    default: {
      parse: vi.fn().mockResolvedValue({
        subject: 'Test Subject',
        from: {email: 'sender@example.com', name: 'Sender'},
        html: '<p>email body</p>',
      }),
    },
  };
});

const BASE_URL = 'https://gmail.googleapis.com';

describe('GmailEmailFetcher', () => {
  const fetcher = new GmailEmailFetcher('test-access-token');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildUrl (via fetch calls)', () => {
    test('users.messages.list builds URL with query params', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({messages: []}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await fetcher.fetchRecentEmails();

      const firstCall = mockFetch.mock.calls[0];
      const url = firstCall[0] as string;
      expect(url).toContain(`${BASE_URL}/gmail/v1/users/me/messages`);
      expect(url).toContain('maxResults=5');
    });

    test('users.messages.get builds URL with message id', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue({
            messages: [{id: 'msg-abc-123'}],
          }),
        })
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue({
            id: 'msg-abc-123',
            raw: btoa('raw email content'),
          }),
        });
      vi.stubGlobal('fetch', mockFetch);

      await fetcher.fetchRecentEmails();

      const secondCall = mockFetch.mock.calls[1];
      const url = secondCall[0] as string;
      expect(url).toContain('/gmail/v1/users/me/messages/msg-abc-123');
      expect(url).toContain('format=RAW');
    });

    test('includes Authorization bearer token header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({messages: []}),
      });
      vi.stubGlobal('fetch', mockFetch);

      await fetcher.fetchRecentEmails();

      const firstCall = mockFetch.mock.calls[0];
      expect(firstCall[1]).toMatchObject({
        headers: {Authorization: 'Bearer test-access-token'},
      });
    });
  });

  describe('fetchRecentEmails', () => {
    test('returns normalized Email[] from API response', async () => {
      const rawContent = btoa('raw email content');
      vi.mocked(PostalMime.default.parse).mockResolvedValue({
        subject: 'Your OTP Code',
        from: {email: 'noreply@example.com', name: 'Example'},
        html: '<p>123456</p>',
        headers: [],
        attachments: [],
      } as any);

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue({messages: [{id: 'msg-1'}]}),
        })
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue({id: 'msg-1', raw: rawContent}),
        });
      vi.stubGlobal('fetch', mockFetch);

      const emails = await fetcher.fetchRecentEmails();

      expect(emails).toHaveLength(1);
      expect(emails[0]).toMatchObject({
        id: 'msg-1',
        subject: 'Your OTP Code',
        from: [{email: 'noreply@example.com', name: 'Example'}],
        content: '<p>123456</p>',
      });
    });

    test('returns empty array when message list has no messages key', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({}),
      });
      vi.stubGlobal('fetch', mockFetch);

      const emails = await fetcher.fetchRecentEmails();
      expect(emails).toEqual([]);
    });

    test('returns empty array and logs error when fetch throws', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

      const emails = await fetcher.fetchRecentEmails();

      expect(emails).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch Gmail messages:', expect.any(Error));
    });

    test('handles message with no from field', async () => {
      const rawContent = btoa('raw content');
      vi.mocked(PostalMime.default.parse).mockResolvedValue({
        subject: 'No From',
        from: undefined,
        html: '<p>body</p>',
        headers: [],
        attachments: [],
      } as any);

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue({messages: [{id: 'msg-2'}]}),
        })
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue({id: 'msg-2', raw: rawContent}),
        });
      vi.stubGlobal('fetch', mockFetch);

      const emails = await fetcher.fetchRecentEmails();
      expect(emails[0]!.from).toBeUndefined();
    });
  });
});
