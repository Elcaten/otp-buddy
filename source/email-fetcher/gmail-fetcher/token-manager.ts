import * as oauth from 'oauth4webapi';
import {log} from '../../utils/logger';
import {tokenStorage} from './token-storage';
import {gmailOauth} from './gmail-oauth';

export const tokenManager = {
  async getAccessToken({interactive}: {interactive: boolean}): Promise<oauth.TokenEndpointResponse> {
    const storedToken = await tokenStorage.get();
    if (storedToken.type === 'valid') {
      return storedToken.token;
    }

    if (storedToken.type === 'expired' && storedToken.token.refresh_token) {
      try {
        const tokenResponse = await gmailOauth.refreshToken({refresh_token: storedToken.token.refresh_token});
        await tokenStorage.set(tokenResponse);

        return tokenResponse;
      } catch (error) {
        // Ignore errors, we will try to get a new token
        // it's the easiest way to handle expired refresh_token
        log.emailFetcher.error('Failed to refresh token', {error});
      }
    }

    const tokenResponse = await gmailOauth.getToken({interactive});
    await tokenStorage.set(tokenResponse);

    return tokenResponse;
  },

  async revokeAccessToken(): Promise<void> {
    const token = await tokenManager.getAccessToken({interactive: false});
    await gmailOauth.revokeToken({token: token.access_token!});
  },
};
