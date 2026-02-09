/**
 * Content Script
 *
 * This script is injected into every web page that matches the patterns
 * defined in manifest.json's content_scripts section.
 *
 */

import browser from 'webextension-polyfill';
import {getStorage} from '../utils/storage';

// Listen for messages from popup or background
browser.runtime.onMessage.addListener(
  (): Promise<undefined> | undefined => undefined
);

// Log when content script loads (if logging is enabled)
getStorage(['enableLogging']).then(({enableLogging}) => {
  if (enableLogging) {
    console.log(
      '[Web Extension Starter] Content script loaded on:',
      window.location.href
    );
  }
});
