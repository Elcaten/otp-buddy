import {describe, test, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';

import useSWR from 'swr';
import Popup from './popup';
import type {StorageSchema} from '../types/storage';

vi.mock('swr', () => {
  return {
    default: vi.fn(),
  };
});

vi.mock('../email-fetcher/fastmail-fetcher');
vi.mock('../email-fetcher/gmail-fetcher/gmail-fetcher');
vi.mock('../email-fetcher/gmail-fetcher/token-manager', () => {
  return {
    tokenManager: {
      getAccessToken: vi.fn(),
      revokeAccessToken: vi.fn(),
    },
  };
});

function makeStorageData(overrides: Partial<StorageSchema> = {}): StorageSchema {
  return {
    provider: 'fastmail',
    fastmailApiKey: '',
    fastmailAccountId: '',
    gmailToken: '',
    gmailTokenTimestamp: 0,
    enableLogging: true,
    visitCount: 0,
    ...overrides,
  };
}

describe('Popup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {writeText: vi.fn().mockResolvedValue(undefined)},
    });
    vi.spyOn(window, 'open').mockReturnValue(null);
  });

  describe('MissingSettings state', () => {
    test('shows missing settings message when no provider is configured (empty apiKey)', async () => {
      vi.mocked(useSWR).mockReturnValue({
        data: makeStorageData({provider: 'fastmail', fastmailApiKey: ''}),
        isLoading: false,
      } as ReturnType<typeof useSWR>);

      render(<Popup />);

      await waitFor(() => {
        expect(screen.getByText(/please set up your email provider/i)).toBeInTheDocument();
      });
    });

    test('shows missing settings when fastmail apiKey present but accountId missing', async () => {
      vi.mocked(useSWR).mockReturnValue({
        data: makeStorageData({
          provider: 'fastmail',
          fastmailApiKey: 'key',
          fastmailAccountId: '',
        }),
        isLoading: false,
      } as ReturnType<typeof useSWR>);

      render(<Popup />);

      await waitFor(() => {
        expect(screen.getByText(/please set up your email provider/i)).toBeInTheDocument();
      });
    });

    test('missing settings message has a link to extension settings', async () => {
      vi.mocked(useSWR).mockReturnValue({
        data: makeStorageData({provider: 'fastmail', fastmailApiKey: ''}),
        isLoading: false,
      } as ReturnType<typeof useSWR>);

      render(<Popup />);

      await waitFor(() => {
        expect(screen.getByRole('button', {name: /extension settings/i})).toBeInTheDocument();
      });
    });
  });

  describe('Gmail provider', () => {
    test('does not show missing settings when gmail provider is set', async () => {
      vi.mocked(useSWR)
        .mockReturnValueOnce({
          data: makeStorageData({provider: 'gmail'}),
          isLoading: false,
        } as ReturnType<typeof useSWR>)
        .mockReturnValue({
          data: [],
          isLoading: false,
        } as ReturnType<typeof useSWR>);

      render(<Popup />);

      await waitFor(() => {
        expect(screen.queryByText(/please set up your email provider/i)).not.toBeInTheDocument();
      });
    });

    test('shows no recent messages when gmail returns empty list', async () => {
      vi.mocked(useSWR)
        .mockReturnValueOnce({
          data: makeStorageData({provider: 'gmail'}),
          isLoading: false,
        } as ReturnType<typeof useSWR>)
        .mockReturnValue({
          data: [],
          isLoading: false,
        } as ReturnType<typeof useSWR>);

      render(<Popup />);

      await waitFor(() => {
        expect(screen.getByText('No messages yet')).toBeInTheDocument();
      });
    });
  });

  describe('Fastmail provider', () => {
    test('does not show missing settings when fastmail fully configured', async () => {
      vi.mocked(useSWR)
        .mockReturnValueOnce({
          data: makeStorageData({
            provider: 'fastmail',
            fastmailApiKey: 'api-key',
            fastmailAccountId: 'acct-id',
          }),
          isLoading: false,
        } as ReturnType<typeof useSWR>)
        .mockReturnValue({
          data: [],
          isLoading: false,
        } as ReturnType<typeof useSWR>);

      render(<Popup />);

      await waitFor(() => {
        expect(screen.queryByText(/please set up your email provider/i)).not.toBeInTheDocument();
      });
    });
  });
});
