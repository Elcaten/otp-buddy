/**
 * Background Script (Service Worker in Chrome MV3)
 *
 * Handles OAUTH_LAUNCH for Safari: receives authURL from popup, sends to native
 * via sendNativeMessage, returns redirect URL so popup can complete token exchange.
 */

import browser from 'webextension-polyfill';
import {isOAuthLaunchMessage} from '../types/messages';
import type {
  NativeOAuthRequest,
  NativeOAuthResponse,
} from '../types/native-messages';

/** Safari native app name (containing app bundle ID). Must match Apple's expected identifier. */
const SAFARI_NATIVE_APP_NAME = 'com.elcaten.otpbuddy';

browser.runtime.onMessage.addListener(async (message: unknown) => {
  if (isOAuthLaunchMessage(message)) {
    try {
      const _nativeAppResponse = await browser.runtime.sendNativeMessage(
        SAFARI_NATIVE_APP_NAME,
        {
          type: 'oauth',
          authURL: message.authURL,
        } satisfies NativeOAuthRequest
      );
      const nativeAppResponse = _nativeAppResponse as NativeOAuthResponse;
      if ('error' in nativeAppResponse) {
        return {error: nativeAppResponse.error};
      }
      return {redirectURL: nativeAppResponse.redirectURL};
    } catch (err) {
      return {error: err instanceof Error ? err.message : String(err)};
    }
  }

  return undefined;
});
