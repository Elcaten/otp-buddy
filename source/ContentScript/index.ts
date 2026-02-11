/**
 * Content Script
 *
 * This script is injected into every web page that matches the patterns
 * defined in manifest.json's content_scripts section.
 *
 */

import browser from 'webextension-polyfill';
import {log} from '../utils/logger';

// Listen for messages from popup or background
browser.runtime.onMessage.addListener(
  (): Promise<undefined> | undefined => undefined
);

log.content.info('Content script loaded', {url: window.location.href});
