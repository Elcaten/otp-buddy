import browser from 'webextension-polyfill';
import {isIdentityApiAvailable} from './is-identity-api-available';

/** Redirect URI for Safari OAuth; must match native app and Google Cloud Console. */
const SAFARI_REDIRECT_URI = 'com.elcaten.otpbuddy:/';

/**
 * Returns the OAuth redirect URI for the current browser.
 * Chrome/Firefox: extension identity redirect URL.
 * Safari: fixed custom URL scheme (native app handles it).
 */

export async function getRedirectURI(): Promise<string> {
  if (isIdentityApiAvailable()) {
    return browser.identity.getRedirectURL();
  }

  return SAFARI_REDIRECT_URI;
}
