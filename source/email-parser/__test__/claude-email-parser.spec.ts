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

  test('tryParse returns ambiguous when no sign-in links found (length !== 1)', () => {
    const result = ClaudeEmailParser.tryParse({
      id: '1',
      subject: 'x',
      from: [{email: 'no-reply@mail.anthropic.com'}],
      content: '<html><body><p>No links here at all.</p></body></html>',
    });
    expect(result).toMatchObject({success: false, error: 'ambiguous'});
  });

  test('tryParse returns ambiguous when multiple sign-in links found', () => {
    const result = ClaudeEmailParser.tryParse({
      id: '1',
      subject: 'x',
      from: [{email: 'no-reply@mail.anthropic.com'}],
      content: `
        <html><body>
          <a href="https://claude.ai/magic-link?token=1">Sign in here</a>
          <a href="https://claude.ai/magic-link?token=2">Sign in again</a>
        </body></html>
      `,
    });
    expect(result).toMatchObject({success: false, error: 'ambiguous'});
  });

  test('tryParse returns ambiguous when content is empty', () => {
    const result = ClaudeEmailParser.tryParse({
      id: '1',
      subject: 'x',
      from: [{email: 'no-reply@mail.anthropic.com'}],
      content: '',
    });
    expect(result).toMatchObject({success: false, error: 'ambiguous'});
  });

  test('tryParse returns ambiguous when content is undefined', () => {
    const result = ClaudeEmailParser.tryParse({
      id: '1',
      subject: 'x',
      from: [{email: 'no-reply@mail.anthropic.com'}],
      content: undefined,
    });
    expect(result).toMatchObject({success: false, error: 'ambiguous'});
  });
});
