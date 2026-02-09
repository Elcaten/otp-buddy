import browser from 'webextension-polyfill';

/**
 * Returns true if the browser supports the identity API.
 * Chrome/Firefox: true.
 * Safari: false.
 */
export function isIdentityApiAvailable(): boolean {
  return typeof browser.identity?.getRedirectURL === 'function';
}
