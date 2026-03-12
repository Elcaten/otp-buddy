/**
 * Content Script
 *
 * This script is injected into every web page that matches the patterns
 * defined in manifest.json's content_scripts section.
 *
 */

import browser from 'webextension-polyfill';
import {fillOtp, findOtpInput} from '../otp-filler/otp-filler';
import {isFillOtpMessage, type FillOtpResponse} from '../types/messages';
import {log} from '../utils/logger';
import {initSentry} from '../utils/sentry';

initSentry();

// Listen for messages from popup or background
browser.runtime.onMessage.addListener(async (message: unknown): Promise<FillOtpResponse | undefined> => {
  if (!isFillOtpMessage(message)) {
    return undefined;
  }

  const page = document.body ?? document.documentElement;
  const input = findOtpInput(page);
  if (input.type === 'not-found') {
    return {success: false, error: 'OTP input not found'};
  }

  if (input.type === 'multi' && input.inputs.length !== message.code.length) {
    return {success: false, error: 'OTP inputs count mismatch'};
  }

  fillOtp({code: message.code, input});

  return {success: true};
});

log.content.info('Content script loaded', {url: window.location.href});
