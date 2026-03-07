/**
 * Centralized Logger
 *
 * Sends log entries to the background script via runtime.sendMessage.
 * Background script handles them in onMessage and outputs to its console.
 * Enable via storage.enableLogging.
 */

import browser from 'webextension-polyfill';
import type {LogMessage} from '../types/messages';

export type LogSource = LogMessage['source'];
export type LogLevel = LogMessage['level'];

function sendLog(level: LogLevel, source: LogSource, message: string, data?: unknown): void {
  const payload: LogMessage = {
    type: 'log',
    level,
    source,
    message,
    ...(data !== undefined && {data}),
  };
  void browser.runtime.sendMessage(payload);
}

export function log(level: LogLevel, source: LogSource, message: string, data?: unknown): void {
  sendLog(level, source, message, data);
}

log.debug = (source: LogSource, message: string, data?: unknown): void => sendLog('debug', source, message, data);
log.info = (source: LogSource, message: string, data?: unknown): void => sendLog('info', source, message, data);
log.warn = (source: LogSource, message: string, data?: unknown): void => sendLog('warn', source, message, data);
log.error = (source: LogSource, message: string, data?: unknown): void => sendLog('error', source, message, data);

log.popup = {
  debug: (message: string, data?: unknown): void => sendLog('debug', 'popup', message, data),
  info: (message: string, data?: unknown): void => sendLog('info', 'popup', message, data),
  warn: (message: string, data?: unknown): void => sendLog('warn', 'popup', message, data),
  error: (message: string, data?: unknown): void => sendLog('error', 'popup', message, data),
};

log.content = {
  debug: (message: string, data?: unknown): void => sendLog('debug', 'content', message, data),
  info: (message: string, data?: unknown): void => sendLog('info', 'content', message, data),
  warn: (message: string, data?: unknown): void => sendLog('warn', 'content', message, data),
  error: (message: string, data?: unknown): void => sendLog('error', 'content', message, data),
};

log.options = {
  debug: (message: string, data?: unknown): void => sendLog('debug', 'options', message, data),
  info: (message: string, data?: unknown): void => sendLog('info', 'options', message, data),
  warn: (message: string, data?: unknown): void => sendLog('warn', 'options', message, data),
  error: (message: string, data?: unknown): void => sendLog('error', 'options', message, data),
};

log.background = {
  debug: (message: string, data?: unknown): void => sendLog('debug', 'background', message, data),
  info: (message: string, data?: unknown): void => sendLog('info', 'background', message, data),
  warn: (message: string, data?: unknown): void => sendLog('warn', 'background', message, data),
  error: (message: string, data?: unknown): void => sendLog('error', 'background', message, data),
};

log.emailFetcher = {
  debug: (message: string, data?: unknown): void => sendLog('debug', 'email-fetcher', message, data),
  info: (message: string, data?: unknown): void => sendLog('info', 'email-fetcher', message, data),
  warn: (message: string, data?: unknown): void => sendLog('warn', 'email-fetcher', message, data),
  error: (message: string, data?: unknown): void => sendLog('error', 'email-fetcher', message, data),
};

log.emailParser = {
  debug: (message: string, data?: unknown): void => sendLog('debug', 'email-parser', message, data),
  info: (message: string, data?: unknown): void => sendLog('info', 'email-parser', message, data),
  warn: (message: string, data?: unknown): void => sendLog('warn', 'email-parser', message, data),
  error: (message: string, data?: unknown): void => sendLog('error', 'email-parser', message, data),
};
