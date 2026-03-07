// @vitest-environment jsdom
import {expect, test, describe} from 'vitest';
import {GitlabEmailParser} from '../gitlab-email-parser';

import gitlabJson from './otpEmailSamples/gitlab-confirm-email.json';

describe('GitlabEmailParser', () => {
  test('should parse the Gitlab email', () => {
    const result = GitlabEmailParser.tryParse({
      id: '123',
      ...gitlabJson,
    });
    expect(result).toMatchObject({success: true, result: '668454'});
  });

  test('canParse returns true for gitlab.com sender', () => {
    expect(
      GitlabEmailParser.canParse({
        id: '1',
        from: [{email: 'no-reply@gitlab.com'}],
        subject: 'x',
        content: '',
      })
    ).toBe(true);
  });

  test('canParse returns false for non-gitlab sender', () => {
    expect(
      GitlabEmailParser.canParse({
        id: '1',
        from: [{email: 'user@gmail.com'}],
        subject: 'x',
        content: '',
      })
    ).toBe(false);
  });

  test('tryParse returns not-found when no 6-digit codes found', () => {
    const result = GitlabEmailParser.tryParse({
      id: '1',
      subject: 'x',
      from: [{email: 'no-reply@gitlab.com'}],
      content: '<html><body><p>No code here</p></body></html>',
    });
    expect(result).toMatchObject({success: false, error: 'not-found'});
  });

  test('tryParse returns ambiguous when multiple nodes have 6-digit codes', () => {
    const result = GitlabEmailParser.tryParse({
      id: '1',
      subject: 'x',
      from: [{email: 'no-reply@gitlab.com'}],
      content: `
        <html><body>
          <p>First code: 123456</p>
          <p>Second code: 654321</p>
        </body></html>
      `,
    });
    expect(result).toMatchObject({success: false, error: 'ambiguous'});
  });

  test('tryParse returns not-found for empty content', () => {
    const result = GitlabEmailParser.tryParse({
      id: '1',
      subject: 'x',
      from: [{email: 'no-reply@gitlab.com'}],
      content: '',
    });
    expect(result).toMatchObject({success: false, error: 'not-found'});
  });
});
