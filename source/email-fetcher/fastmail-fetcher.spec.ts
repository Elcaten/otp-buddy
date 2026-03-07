import {describe, test, expect, vi, beforeEach} from 'vitest';

import {FastmailEmailFetcher} from './fastmail-fetcher';

const mockMailboxQuery = vi.fn();
const mockEmailQuery = vi.fn();
const mockEmailGet = vi.fn();

vi.mock('jmap-jam', () => {return {
  default: function MockJamClient() {
    return {
      session: Promise.resolve(),
      api: {
        Mailbox: {
          query: mockMailboxQuery,
        },
        Email: {
          query: mockEmailQuery,
          get: mockEmailGet,
        },
      },
    };
  },
}});

describe('FastmailEmailFetcher', () => {
  const fetcher = new FastmailEmailFetcher('test-api-key', 'account-123');

  beforeEach(() => {
    vi.clearAllMocks();

    mockMailboxQuery.mockResolvedValue([{ids: ['trash-id', 'sent-id', 'drafts-id']}]);
    mockEmailQuery.mockResolvedValue([{ids: ['email-1', 'email-2']}]);
    mockEmailGet.mockResolvedValue([
      {
        list: [
          {
            id: 'email-1',
            subject: 'Test Email 1',
            from: [{email: 'sender1@example.com', name: 'Sender One'}],
            bodyValues: {'1': {value: '<p>Body one</p>'}},
          },
          {
            id: 'email-2',
            subject: 'Test Email 2',
            from: [{email: 'sender2@example.com', name: 'Sender Two'}],
            bodyValues: {'1': {value: '<p>Body two</p>'}},
          },
        ],
      },
    ]);
  });

  test('returns normalized Email[] from Fastmail API', async () => {
    const emails = await fetcher.fetchRecentEmails();

    expect(emails).toHaveLength(2);
    expect(emails[0]).toEqual({
      id: 'email-1',
      subject: 'Test Email 1',
      from: [{email: 'sender1@example.com', name: 'Sender One'}],
      content: '<p>Body one</p>',
    });
    expect(emails[1]).toEqual({
      id: 'email-2',
      subject: 'Test Email 2',
      from: [{email: 'sender2@example.com', name: 'Sender Two'}],
      content: '<p>Body two</p>',
    });
  });

  test('queries mailboxes with trash, sent, and drafts filter', async () => {
    await fetcher.fetchRecentEmails();

    expect(mockMailboxQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-123',
        filter: expect.objectContaining({
          operator: 'OR',
          conditions: expect.arrayContaining([
            {role: 'trash'},
            {role: 'sent'},
            {role: 'drafts'},
          ]),
        }),
      })
    );
  });

  test('passes unwanted mailbox ids to inMailboxOtherThan', async () => {
    await fetcher.fetchRecentEmails();

    expect(mockEmailQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-123',
        filter: expect.objectContaining({
          inMailboxOtherThan: ['trash-id', 'sent-id', 'drafts-id'],
        }),
      })
    );
  });

  test('fetches email details with correct properties', async () => {
    await fetcher.fetchRecentEmails();

    expect(mockEmailGet).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-123',
        ids: ['email-1', 'email-2'],
        properties: ['id', 'subject', 'bodyValues', 'from'],
        fetchHTMLBodyValues: true,
      })
    );
  });

  test('returns empty array when email list is empty', async () => {
    mockEmailQuery.mockResolvedValue([{ids: []}]);
    mockEmailGet.mockResolvedValue([{list: []}]);

    const emails = await fetcher.fetchRecentEmails();
    expect(emails).toEqual([]);
  });

  test('uses first bodyValues entry as content', async () => {
    mockEmailGet.mockResolvedValue([
      {
        list: [
          {
            id: 'email-1',
            subject: 'Test',
            from: [],
            bodyValues: {
              part1: {value: '<p>first part</p>'},
              part2: {value: '<p>second part</p>'},
            },
          },
        ],
      },
    ]);

    const emails = await fetcher.fetchRecentEmails();
    expect(emails[0]!.content).toBe('<p>first part</p>');
  });
});
