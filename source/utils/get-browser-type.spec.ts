import {describe, test, expect, vi, beforeEach} from 'vitest';

describe('getBrowserType', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('returns chrome_firefox when browser.identity.getRedirectURL is a function', async () => {
    vi.doMock('webextension-polyfill', () => {return {
      default: {
        identity: {
          getRedirectURL: () => 'https://mock-redirect.example/',
        },
      },
    }});

    const {getBrowserType} = await import('./get-browser-type');
    expect(getBrowserType()).toBe('chrome_firefox');
  });

  test('returns safari when browser.identity.getRedirectURL is not a function', async () => {
    vi.doMock('webextension-polyfill', () => {return {
      default: {
        identity: {},
      },
    }});

    const {getBrowserType} = await import('./get-browser-type');
    expect(getBrowserType()).toBe('safari');
  });

  test('returns safari when browser.identity is undefined', async () => {
    vi.doMock('webextension-polyfill', () => {return {
      default: {},
    }});

    const {getBrowserType} = await import('./get-browser-type');
    expect(getBrowserType()).toBe('safari');
  });
});
