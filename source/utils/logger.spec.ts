import {describe, test, expect, vi, beforeEach} from 'vitest';
import {mockBrowser} from '@/__mocks__/webextension-polyfill';

import {log} from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('builds correct LogMessage payload and calls runtime.sendMessage', () => {
    log.info('popup', 'test message', {extra: 'data'});

    expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'log',
      level: 'info',
      source: 'popup',
      message: 'test message',
      data: {extra: 'data'},
    });
  });

  test('omits data key when data argument is undefined', () => {
    log.warn('background', 'no data here');

    const call = vi.mocked(mockBrowser.runtime.sendMessage).mock.calls[0]![0];
    expect(call).toMatchObject({
      type: 'log',
      level: 'warn',
      source: 'background',
      message: 'no data here',
    });
    expect(call).not.toHaveProperty('data');
  });

  test('log.debug sends correct level', () => {
    log.debug('options', 'debug msg');

    expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({level: 'debug', source: 'options'})
    );
  });

  test('log.error sends correct level', () => {
    log.error('content', 'error msg', {error: 'oops'});

    expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({level: 'error', source: 'content'})
    );
  });

  test('log.popup.info sends with source popup', () => {
    log.popup.info('popup message');

    expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({source: 'popup', level: 'info', message: 'popup message'})
    );
  });

  test('log.popup.warn sends with source popup and level warn', () => {
    log.popup.warn('popup warn');

    expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({source: 'popup', level: 'warn'})
    );
  });

  test('log.background.debug sends with source background', () => {
    log.background.debug('bg debug');

    expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({source: 'background', level: 'debug'})
    );
  });

  test('log.emailFetcher.error sends with source email-fetcher', () => {
    log.emailFetcher.error('fetcher error', {error: new Error('oops')});

    expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({source: 'email-fetcher', level: 'error'})
    );
  });

  test('log.options.info sends with source options', () => {
    log.options.info('saved');

    expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({source: 'options', level: 'info'})
    );
  });

  test('log.content.warn sends with source content', () => {
    log.content.warn('content warn');

    expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({source: 'content', level: 'warn'})
    );
  });
});
