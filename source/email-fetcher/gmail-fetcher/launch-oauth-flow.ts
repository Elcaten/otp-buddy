import browser from 'webextension-polyfill';

import {isIdentityApiAvailable} from './is-identity-api-available';
import {isOAuthLaunchResponse, OAuthLaunchMessage} from '../../types/messages';

/**
 * Launches the OAuth flow and returns the final redirect URL (with ?code=...).
 * Chrome/Firefox: launchWebAuthFlow.
 * Safari: asks background via runtime.sendMessage; background uses sendNativeMessage.
 */
export async function launchOAuthFlow(authURL: string): Promise<string> {
  if (isIdentityApiAvailable()) {
    return browser.identity.launchWebAuthFlow({
      interactive: true,
      url: authURL,
    });
  }

  const backgroundResponse = await browser.runtime.sendMessage({
    type: 'OAUTH_LAUNCH',
    authURL,
  } satisfies OAuthLaunchMessage);
  if (isOAuthLaunchResponse(backgroundResponse)) {
    if (backgroundResponse?.error) {
      throw new Error(backgroundResponse.error);
    }
    if (backgroundResponse?.redirectURL == null) {
      throw new Error('No redirect URL from OAuth flow');
    }
    return backgroundResponse.redirectURL;
  }

  throw new Error('Failed to launch OAuth flow');
}
