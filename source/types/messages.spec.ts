import {describe, test, expect} from 'vitest';
import {
  isFillOtpMessage,
  isFillOtpResponse,
  isOAuthLaunchMessage,
  isOAuthLaunchResponse,
  isLogMessage,
} from './messages';

describe('isOAuthLaunchMessage', () => {
  test('returns true for valid OAuth launch message', () => {
    expect(
      isOAuthLaunchMessage({
        type: 'OAUTH_LAUNCH',
        authURL: 'https://auth.example',
      })
    ).toBe(true);
  });

  test('returns false for wrong type', () => {
    expect(isOAuthLaunchMessage({type: 'log', authURL: 'x'})).toBe(false);
  });

  test('returns false for missing authURL', () => {
    expect(isOAuthLaunchMessage({type: 'OAUTH_LAUNCH'})).toBe(false);
  });

  test('returns false for non-string authURL', () => {
    expect(isOAuthLaunchMessage({type: 'OAUTH_LAUNCH', authURL: 123})).toBe(
      false
    );
  });

  test('returns false for null or undefined', () => {
    expect(isOAuthLaunchMessage(null)).toBe(false);
    expect(isOAuthLaunchMessage(undefined)).toBe(false);
  });
});

describe('isOAuthLaunchResponse', () => {
  test('returns true for response with redirectURL', () => {
    expect(isOAuthLaunchResponse({redirectURL: 'https://example.com'})).toBe(
      true
    );
  });

  test('returns true for response with error', () => {
    expect(isOAuthLaunchResponse({error: 'auth failed'})).toBe(true);
  });

  test('returns true for empty object', () => {
    expect(isOAuthLaunchResponse({})).toBe(true);
  });

  test('returns false for invalid types', () => {
    expect(isOAuthLaunchResponse({redirectURL: 123})).toBe(false);
    expect(isOAuthLaunchResponse({error: 456})).toBe(false);
  });
});

describe('isFillOtpMessage', () => {
  test('returns true for valid fill message', () => {
    expect(isFillOtpMessage({type: 'FILL_OTP', code: '123456'})).toBe(true);
  });

  test('returns false for wrong type or missing code', () => {
    expect(isFillOtpMessage({type: 'log', code: '123456'})).toBe(false);
    expect(isFillOtpMessage({type: 'FILL_OTP'})).toBe(false);
  });
});

describe('isFillOtpResponse', () => {
  test('returns true for valid success response', () => {
    expect(isFillOtpResponse({success: true})).toBe(true);
  });

  test('returns true for valid error response', () => {
    expect(isFillOtpResponse({success: false, error: 'OTP input not found'})).toBe(
      true
    );
  });

  test('returns false for invalid response shape', () => {
    expect(isFillOtpResponse({success: 'yes'})).toBe(false);
  });
});

describe('isLogMessage', () => {
  test('returns true for valid log message', () => {
    expect(
      isLogMessage({
        type: 'log',
        level: 'info',
        source: 'popup',
        message: 'test',
      })
    ).toBe(true);
  });

  test('accepts all valid levels', () => {
    for (const level of ['debug', 'info', 'warn', 'error'] as const) {
      expect(
        isLogMessage({type: 'log', level, source: 'popup', message: 'x'})
      ).toBe(true);
    }
  });

  test('returns false for wrong type', () => {
    expect(
      isLogMessage({
        type: 'OAUTH_LAUNCH',
        level: 'info',
        source: 'x',
        message: 'x',
      })
    ).toBe(false);
  });

  test('returns false for invalid level', () => {
    expect(
      isLogMessage({
        type: 'log',
        level: 'invalid',
        source: 'popup',
        message: 'x',
      })
    ).toBe(false);
  });

  test('returns false for missing required fields', () => {
    expect(isLogMessage({type: 'log', level: 'info', message: 'x'})).toBe(
      false
    );
    expect(isLogMessage({type: 'log', level: 'info', source: 'popup'})).toBe(
      false
    );
  });
});
