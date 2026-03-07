/**
 * Background Script (Service Worker in Chrome MV3)
 *
 * Handles OAUTH_LAUNCH for Safari: receives authURL from popup, sends to native
 * via sendNativeMessage, returns redirect URL so popup can complete token exchange.
 */

import browser from 'webextension-polyfill';
import {
  ExtensionMessage,
  isLogMessage,
  isOAuthLaunchMessage,
  OAuthLaunchResponse,
} from '../types/messages';
import type {
  NativeOAuthRequest,
  NativeOAuthResponse,
} from '../types/native-messages';
import {getStorage} from '../utils/storage';
import {log} from '../utils/logger';

/** Same as safari native app bundle ID. NOT extension bundle ID. */
const SAFARI_NATIVE_APP_NAME = 'com.elcaten.otpbuddy';

browser.runtime.onMessage.addListener(
  async (message: unknown): Promise<ExtensionMessage | undefined> => {
    if (isLogMessage(message)) {
      const {enableLogging} = await getStorage(['enableLogging']);
      if (!enableLogging) return undefined;

      const entry = {
        ...message,
        timestamp: message.timestamp ?? Date.now(),
      };
      const prefix = `[OTPBuddy][${entry.source}]`;
      const args =
        entry.data !== undefined
          ? [prefix, entry.message, entry.data]
          : [prefix, entry.message];
      console[entry.level](...args);
      return undefined;
    }

    if (isOAuthLaunchMessage(message)) {
      log.background.info('OAuth launch: sending authURL to native app');
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
          log.background.error('OAuth native app returned error', {
            error: nativeAppResponse.error,
          });
          return {error: nativeAppResponse.error} satisfies OAuthLaunchResponse;
        }
        log.background.info('OAuth succeeded', {
          redirectURL: nativeAppResponse.redirectURL,
        });
        return {
          redirectURL: nativeAppResponse.redirectURL,
        } satisfies OAuthLaunchResponse;
      } catch (err) {
        log.background.error(
          'OAuth native message failed',
          err instanceof Error ? err : String(err)
        );
        return {error: err instanceof Error ? err.message : String(err)};
      }
    }

    return undefined;
  }
);
