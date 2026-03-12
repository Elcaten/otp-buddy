/**
 * Content Script
 *
 * This script is injected into every web page that matches the patterns
 * defined in manifest.json's content_scripts section.
 *
 */

import browser from 'webextension-polyfill';
import {initSentry} from '../utils/sentry';

initSentry();

// Listen for messages from popup or background
browser.runtime.onMessage.addListener((): Promise<undefined> | undefined => undefined);
