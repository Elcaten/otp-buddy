import {describe, test, expect, vi, beforeEach} from 'vitest';
import {renderHook} from '@testing-library/react';

import useSWR from 'swr';
import {tokenStorage} from '../email-fetcher/gmail-fetcher/token-storage';
import {tokenManager} from '../email-fetcher/gmail-fetcher/token-manager';
import {getUserProfile} from '../email-fetcher/gmail-fetcher/user-profile';
import {useGmailProfile, useSignIn, useSignOut} from './use-gmail-auth';
import {TokenEndpointResponse} from 'oauth4webapi';

vi.mock('swr', () => {
  return {
    default: vi.fn(),
    useSWRConfig: vi.fn().mockReturnValue({mutate: vi.fn()}),
  };
});
vi.mock('swr/mutation', () => {
  return {
    default: vi.fn().mockReturnValue({trigger: vi.fn(), isMutating: false}),
  };
});

vi.mock('../email-fetcher/gmail-fetcher/token-storage', () => {
  return {
    tokenStorage: {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
    },
  };
});

vi.mock('../email-fetcher/gmail-fetcher/token-manager', () => {
  return {
    tokenManager: {
      getAccessToken: vi.fn(),
      revokeAccessToken: vi.fn(),
    },
  };
});

vi.mock('../email-fetcher/gmail-fetcher/user-profile', () => {
  return {
    getUserProfile: vi.fn(),
  };
});

describe('useGmailProfile', () => {
  let capturedFetcher: (() => Promise<unknown>) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedFetcher = undefined;

    vi.mocked(useSWR).mockImplementation((key, fetcher) => {
      if (key === 'gmailUserProfile') {
        capturedFetcher = fetcher as () => Promise<unknown>;
      }
      return {data: undefined, isLoading: false} as ReturnType<typeof useSWR>;
    });
  });

  test('returns null when token is not found', async () => {
    vi.mocked(tokenStorage.get).mockResolvedValue({type: 'not_found'});

    renderHook(() => useGmailProfile());

    const result = await capturedFetcher?.();
    expect(result).toBeNull();
    expect(tokenManager.getAccessToken).not.toHaveBeenCalled();
  });

  test('returns null when token is expired', async () => {
    const expiredToken: TokenEndpointResponse = {access_token: 'old', expires_in: 0, token_type: 'bearer'};
    vi.mocked(tokenStorage.get).mockResolvedValue({
      type: 'expired',
      token: expiredToken,
    });

    renderHook(() => useGmailProfile());

    const result = await capturedFetcher?.();
    expect(result).toBeNull();
    expect(tokenManager.getAccessToken).not.toHaveBeenCalled();
  });

  test('returns user profile when token is valid', async () => {
    const validToken: TokenEndpointResponse = {access_token: 'valid-tok', expires_in: 3600, token_type: 'bearer'};
    const mockProfile = {email: 'user@example.com', name: 'Test User'};

    vi.mocked(tokenStorage.get).mockResolvedValue({
      type: 'valid',
      token: validToken,
    });
    vi.mocked(tokenManager.getAccessToken).mockResolvedValue(validToken);
    vi.mocked(getUserProfile).mockResolvedValue(mockProfile);

    renderHook(() => useGmailProfile());

    const result = await capturedFetcher?.();
    expect(result).toEqual(mockProfile);
    expect(tokenManager.getAccessToken).toHaveBeenCalledWith({interactive: false});
    expect(getUserProfile).toHaveBeenCalledWith('valid-tok');
  });

  test('returns null when getAccessToken throws', async () => {
    const validToken: TokenEndpointResponse = {access_token: 'tok', expires_in: 3600, token_type: 'bearer'};
    vi.mocked(tokenStorage.get).mockResolvedValue({
      type: 'valid',
      token: validToken,
    });
    vi.mocked(tokenManager.getAccessToken).mockRejectedValue(new Error('auth failed'));

    renderHook(() => useGmailProfile());

    const result = await capturedFetcher?.();
    expect(result).toBeNull();
  });

  test('registers SWR hook with gmailUserProfile key', () => {
    vi.mocked(tokenStorage.get).mockResolvedValue({type: 'not_found'});

    renderHook(() => useGmailProfile());

    expect(useSWR).toHaveBeenCalledWith(
      'gmailUserProfile',
      expect.any(Function),
      expect.objectContaining({suspense: true})
    );
  });
});

describe('useSignIn', () => {
  test('returns a trigger function', () => {
    const {result} = renderHook(() => useSignIn());
    expect(result.current.trigger).toBeTypeOf('function');
  });
});

describe('useSignOut', () => {
  test('returns a trigger function', () => {
    const {result} = renderHook(() => useSignOut());
    expect(result.current.trigger).toBeTypeOf('function');
  });
});
