import {expect, test, describe} from 'vitest';
import {emailParser} from '../index';

import gitlabJson from './otpEmailSamples/gitlab-confirm-email.json';
import polymarketJson from './otpEmailSamples/polymarket-login-code.json';

describe('emailParser', () => {
  test('canParse returns true when any parser can parse', () => {
    expect(
      emailParser.canParse({
        id: '1',
        from: [{email: 'x@gitlab.com'}],
        subject: 'x',
        content: '',
      })
    ).toBe(true);
    expect(
      emailParser.canParse({
        id: '1',
        from: [{name: 'Polymarket'}],
        subject: '123456',
        content: '',
      })
    ).toBe(true);
  });

  test('canParse returns false when no parser can parse', () => {
    expect(
      emailParser.canParse({
        id: '1',
        from: [{email: 'user@gmail.com'}],
        subject: 'Hello',
        content: '',
      })
    ).toBe(false);
  });

  test('tryParse delegates to first matching parser', () => {
    const gitlabResult = emailParser.tryParse({id: '1', ...gitlabJson});
    expect(gitlabResult).toMatchObject({success: true, result: '668454'});

    const polymarketResult = emailParser.tryParse({
      id: '1',
      ...polymarketJson,
    });
    expect(polymarketResult).toMatchObject({success: true, result: '641481'});
  });

  test('tryParse returns not-found when no parser matches', () => {
    const result = emailParser.tryParse({
      id: '1',
      from: [{email: 'user@gmail.com'}],
      subject: 'Hello',
      content: '',
    });
    expect(result).toMatchObject({success: false, error: 'not-found'});
  });
});
