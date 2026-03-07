import {expect, test, describe} from 'vitest';
import {PolymarketEmailParser} from '../polymarket-email-parser';

import polymarketJson from './otpEmailSamples/polymarket-login-code.json';

describe('PolymarketEmailParser', () => {
  test('canParse returns true when from name includes polymarket', () => {
    expect(
      PolymarketEmailParser.canParse({
        id: '1',
        from: [{name: 'Polymarket', email: 'noreply@trymagic.com'}],
        subject: 'x',
        content: '',
      })
    ).toBe(true);
  });

  test('canParse returns false when from name does not include polymarket', () => {
    expect(
      PolymarketEmailParser.canParse({
        id: '1',
        from: [{name: 'Other', email: 'noreply@example.com'}],
        subject: 'x',
        content: '',
      })
    ).toBe(false);
  });

  test('tryParse extracts 6-digit code from subject', () => {
    const result = PolymarketEmailParser.tryParse({
      id: '123',
      ...polymarketJson,
    });
    expect(result).toMatchObject({success: true, result: '641481'});
  });

  test('canParse returns false when from is undefined', () => {
    expect(
      PolymarketEmailParser.canParse({
        id: '1',
        from: undefined,
        subject: 'x',
        content: '',
      })
    ).toBe(false);
  });

  test('canParse is case-insensitive for polymarket name', () => {
    expect(
      PolymarketEmailParser.canParse({
        id: '1',
        from: [{name: 'POLYMARKET', email: 'noreply@trymagic.com'}],
        subject: 'x',
        content: '',
      })
    ).toBe(true);
  });

  test('tryParse returns not-found when subject has no 6-digit code', () => {
    const result = PolymarketEmailParser.tryParse({
      id: '1',
      subject: 'Welcome to Polymarket',
      from: [{name: 'Polymarket'}],
      content: '',
    });
    expect(result).toMatchObject({success: false, error: 'not-found'});
  });

  test('tryParse returns not-found when subject is undefined', () => {
    const result = PolymarketEmailParser.tryParse({
      id: '1',
      subject: undefined,
      from: [{name: 'Polymarket'}],
      content: '',
    });
    expect(result).toMatchObject({success: false, error: 'not-found'});
  });
});
