import browser from 'webextension-polyfill';

export function getBrowserType(): 'chrome_firefox' | 'safari' {
  return typeof browser.identity?.getRedirectURL === 'function' ? 'chrome_firefox' : 'safari';
}
