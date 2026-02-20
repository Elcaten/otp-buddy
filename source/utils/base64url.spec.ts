import {describe, test, expect} from 'vitest';
import {stringToBase64URL, stringFromBase64URL} from './base64url';

describe('stringToBase64URL / stringFromBase64URL', () => {
  test('round-trip for ASCII string', () => {
    const input = 'hello world';
    const encoded = stringToBase64URL(input);
    expect(stringFromBase64URL(encoded)).toBe(input);
  });

  test('round-trip for empty string', () => {
    const input = '';
    const encoded = stringToBase64URL(input);
    expect(encoded).toBe('');
    expect(stringFromBase64URL(encoded)).toBe(input);
  });

  test('round-trip for Unicode string', () => {
    const input = 'café 日本語 🎉';
    const encoded = stringToBase64URL(input);
    expect(stringFromBase64URL(encoded)).toBe(input);
  });

  test('encoded output uses base64url alphabet (no + or /)', () => {
    const encoded = stringToBase64URL('test');
    expect(encoded).not.toMatch(/[+/=]/);
  });

  test('stringFromBase64URL throws on invalid character', () => {
    expect(() => stringFromBase64URL('a+b')).toThrow(/Invalid Base64-URL/);
  });
});
