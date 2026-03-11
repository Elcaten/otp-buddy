// @vitest-environment jsdom
import {describe, test, expect} from 'vitest';
import {emailParserConfig} from '../email-parser-config';
import {EmailParser} from '../email-parser';

import claudeJson from './claude-login-link.json';
import gitlabJson from './gitlab-confirm-email.json';
import polymarketJson from './polymarket-login-code.json';

const parser = new EmailParser(emailParserConfig);

describe('Claude', () => {
  const email = {id: '1', ...claudeJson};

  test('canParse', () => {
    expect(parser.canParse(email)).toBe(true);
  });

  test('extracts sign-in link', () => {
    expect(parser.tryParse(email)).toMatchObject({
      success: true,
      result: 'https://claude.ai/magic-link#530c5933f4b0d0aa6d7a93085ab558c1:Y29vbC5jZWxsODEzM0BmYXN0bWFpbC5jb20=',
    });
  });
});

describe('Polymarket', () => {
  const email = {id: '1', ...polymarketJson};

  test('canParse', () => {
    expect(parser.canParse(email)).toBe(true);
  });

  test('extracts OTP from subject', () => {
    expect(parser.tryParse(email)).toMatchObject({success: true, result: '641481'});
  });
});

describe('GitLab', () => {
  const email = {id: '1', ...gitlabJson};

  test('canParse', () => {
    expect(parser.canParse(email)).toBe(true);
  });

  test('extracts OTP from body', () => {
    expect(parser.tryParse(email)).toMatchObject({success: true, result: '668454'});
  });
});
