import {expect, test, describe} from 'vitest';
import {ClaudeEmailParser} from '../claude-email-parser';

import claudeJson from './otpEmailSamples/claude-login-link.json';

describe('ClaudeEmailParser', () => {
  test('canParse returns true for anthropic.com email', () => {
    expect(
      ClaudeEmailParser.canParse({
        id: '1',
        from: [{email: 'no-reply@mail.anthropic.com', name: 'Anthropic'}],
        subject: 'x',
        content: '',
      })
    ).toBe(true);
  });

  test('canParse returns false for non-anthropic email', () => {
    expect(
      ClaudeEmailParser.canParse({
        id: '1',
        from: [{email: 'user@gmail.com'}],
        subject: 'x',
        content: '',
      })
    ).toBe(false);
  });

  test('tryParse extracts sign-in link from Claude email', () => {
    const result = ClaudeEmailParser.tryParse({
      id: '123',
      ...claudeJson,
    });
    expect(result).toMatchObject({success: true});
    expect((result as {success: true; result: string}).result).toContain(
      'claude.ai/magic-link'
    );
  });
});
