import {describe, test, expect, vi, beforeEach} from 'vitest';

import {tokenStorage} from './token-storage';
import {gmailOauth} from './gmail-oauth';
import {tokenManager} from './token-manager';
import {TokenEndpointResponse} from 'oauth4webapi';

vi.mock('./token-storage', () => {
  return {
    tokenStorage: {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
    },
  };
});

vi.mock('./gmail-oauth', () => {
  return {
    gmailOauth: {
      getToken: vi.fn(),
      refreshToken: vi.fn(),
      revokeToken: vi.fn(),
    },
  };
});

describe('tokenManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAccessToken', () => {
    test('returns cached token when stored token is valid', async () => {
      const token: TokenEndpointResponse = {access_token: 'valid_tok', expires_in: 3600, token_type: 'bearer'};
      vi.mocked(tokenStorage.get).mockResolvedValue({type: 'valid', token});

      const result = await tokenManager.getAccessToken({interactive: false});

      expect(result).toBe(token);
      expect(gmailOauth.refreshToken).not.toHaveBeenCalled();
      expect(gmailOauth.getToken).not.toHaveBeenCalled();
    });

    test('refreshes token when expired and refresh_token is present', async () => {
      const expiredToken: TokenEndpointResponse = {
        access_token: 'old',
        expires_in: 0,
        refresh_token: 'ref_tok',
        token_type: 'earer',
      };
      const refreshedToken: TokenEndpointResponse = {access_token: 'new', expires_in: 3600, token_type: 'bearer'};
      vi.mocked(tokenStorage.get).mockResolvedValue({
        type: 'expired',
        token: expiredToken,
      });
      vi.mocked(gmailOauth.refreshToken).mockResolvedValue(refreshedToken);

      const result = await tokenManager.getAccessToken({interactive: false});

      expect(gmailOauth.refreshToken).toHaveBeenCalledWith({
        refresh_token: 'ref_tok',
      });
      expect(tokenStorage.set).toHaveBeenCalledWith(refreshedToken);
      expect(gmailOauth.getToken).not.toHaveBeenCalled();
      expect(result).toBe(refreshedToken);
    });

    test('falls through to full OAuth flow when refresh throws', async () => {
      const expiredToken: TokenEndpointResponse = {
        access_token: 'old',
        expires_in: 0,
        refresh_token: 'ref_tok',
        token_type: 'bearer',
      };
      const freshToken: TokenEndpointResponse = {access_token: 'fresh', expires_in: 3600, token_type: 'bearer'};
      vi.mocked(tokenStorage.get).mockResolvedValue({
        type: 'expired',
        token: expiredToken,
      });
      vi.mocked(gmailOauth.refreshToken).mockRejectedValue(new Error('refresh failed'));
      vi.mocked(gmailOauth.getToken).mockResolvedValue(freshToken);

      const result = await tokenManager.getAccessToken({interactive: true});

      expect(gmailOauth.refreshToken).toHaveBeenCalled();
      expect(gmailOauth.getToken).toHaveBeenCalledWith({interactive: true});
      expect(tokenStorage.set).toHaveBeenCalledWith(freshToken);
      expect(result).toBe(freshToken);
    });

    test('skips refresh and runs full flow when expired token has no refresh_token', async () => {
      const expiredToken: TokenEndpointResponse = {access_token: 'old', expires_in: 0, token_type: 'bearer'};
      const freshToken: TokenEndpointResponse = {access_token: 'fresh', expires_in: 3600, token_type: 'bearer'};
      vi.mocked(tokenStorage.get).mockResolvedValue({
        type: 'expired',
        token: expiredToken,
      });
      vi.mocked(gmailOauth.getToken).mockResolvedValue(freshToken);

      const result = await tokenManager.getAccessToken({interactive: true});

      expect(gmailOauth.refreshToken).not.toHaveBeenCalled();
      expect(gmailOauth.getToken).toHaveBeenCalledWith({interactive: true});
      expect(result).toBe(freshToken);
    });

    test('runs full OAuth flow when token is not found', async () => {
      const freshToken: TokenEndpointResponse = {access_token: 'fresh', expires_in: 3600, token_type: 'bearer'};
      vi.mocked(tokenStorage.get).mockResolvedValue({type: 'not_found'});
      vi.mocked(gmailOauth.getToken).mockResolvedValue(freshToken);

      const result = await tokenManager.getAccessToken({interactive: false});

      expect(gmailOauth.getToken).toHaveBeenCalledWith({interactive: false});
      expect(tokenStorage.set).toHaveBeenCalledWith(freshToken);
      expect(result).toBe(freshToken);
    });

    test('passes interactive flag correctly to getToken', async () => {
      const token: TokenEndpointResponse = {access_token: 'tok', expires_in: 3600, token_type: 'bearer'};
      vi.mocked(tokenStorage.get).mockResolvedValue({type: 'not_found'});
      vi.mocked(gmailOauth.getToken).mockResolvedValue(token);

      await tokenManager.getAccessToken({interactive: true});
      expect(gmailOauth.getToken).toHaveBeenCalledWith({interactive: true});

      vi.clearAllMocks();
      vi.mocked(tokenStorage.get).mockResolvedValue({type: 'not_found'});
      vi.mocked(gmailOauth.getToken).mockResolvedValue(token);

      await tokenManager.getAccessToken({interactive: false});
      expect(gmailOauth.getToken).toHaveBeenCalledWith({interactive: false});
    });
  });
});
