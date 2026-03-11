// @vitest-environment jsdom
import {describe, test, expect} from 'vitest';
import {EmailParser} from '../email-parser';
import type {EmailParserConfig} from '../email-parser-config';
import type {Email} from '../../types/email';

const makeEmail = (overrides: Partial<Email> = {}): Email => {
  return {
    id: '1',
    subject: undefined,
    from: undefined,
    content: undefined,
    ...overrides,
  };
};

// ---------------------------------------------------------------------------
// Matchers
// ---------------------------------------------------------------------------

describe('matchers', () => {
  test('sender.email endsWith', () => {
    const parser = new EmailParser({
      rules: [
        {
          matchers: [{field: 'sender.email', op: 'endsWith', value: 'gitlab.com'}],
          extractors: [{source: 'subject', method: 'regex', pattern: '\\d{6}'}],
        },
      ],
    });
    expect(parser.canParse(makeEmail({from: [{email: 'no-reply@gitlab.com'}]}))).toBe(true);
    expect(parser.canParse(makeEmail({from: [{email: 'no-reply@gmail.com'}]}))).toBe(false);
  });

  test('sender.name contains', () => {
    const parser = new EmailParser({
      rules: [
        {
          matchers: [{field: 'sender.name', op: 'contains', value: 'Polymarket'}],
          extractors: [{source: 'subject', method: 'regex', pattern: '\\d{6}'}],
        },
      ],
    });
    expect(parser.canParse(makeEmail({from: [{name: 'Polymarket Team'}]}))).toBe(true);
    expect(parser.canParse(makeEmail({from: [{name: 'GitHub'}]}))).toBe(false);
  });

  test('subject contains', () => {
    const parser = new EmailParser({
      rules: [
        {
          matchers: [{field: 'subject', op: 'contains', value: 'Your OTP'}],
          extractors: [{source: 'subject', method: 'regex', pattern: '\\d{6}'}],
        },
      ],
    });
    expect(parser.canParse(makeEmail({subject: 'Your OTP is ready'}))).toBe(true);
    expect(parser.canParse(makeEmail({subject: 'Welcome!'}))).toBe(false);
  });

  test('body matches regex', () => {
    const parser = new EmailParser({
      rules: [
        {
          matchers: [{field: 'body', op: 'matches', value: 'verify your account'}],
          extractors: [{source: 'body', method: 'regex', pattern: '\\d{6}'}],
        },
      ],
    });
    expect(parser.canParse(makeEmail({content: '<p>Please verify your account: 123456</p>'}))).toBe(true);
    expect(parser.canParse(makeEmail({content: '<p>Welcome!</p>'}))).toBe(false);
  });

  describe('op variants', () => {
    const makeParser = (op: EmailParserConfig['rules'][number]['matchers'][number]['op']) =>
      new EmailParser({
        rules: [
          {
            matchers: [{field: 'subject', op, value: 'code'}],
            extractors: [{source: 'subject', method: 'regex', pattern: '\\d{6}'}],
          },
        ],
      });

    test('startsWith', () => {
      const p = makeParser('startsWith');
      expect(p.canParse(makeEmail({subject: 'code: 123456'}))).toBe(true);
      expect(p.canParse(makeEmail({subject: 'your code: 123456'}))).toBe(false);
    });

    test('endsWith', () => {
      const p = makeParser('endsWith');
      expect(p.canParse(makeEmail({subject: 'your code'}))).toBe(true);
      expect(p.canParse(makeEmail({subject: 'code is here'}))).toBe(false);
    });

    test('equals', () => {
      const p = makeParser('equals');
      expect(p.canParse(makeEmail({subject: 'code'}))).toBe(true);
      expect(p.canParse(makeEmail({subject: 'your code'}))).toBe(false);
    });

    test('matches (regex)', () => {
      const p = makeParser('matches');
      expect(p.canParse(makeEmail({subject: 'your code'}))).toBe(true);
      expect(p.canParse(makeEmail({subject: 'your CODE'}))).toBe(false);
    });
  });

  describe('matchMode', () => {
    const twoMatcherRule = (mode: 'all' | 'any'): EmailParserConfig => {
      return {
        rules: [
          {
            matchMode: mode,
            matchers: [
              {field: 'sender.email', op: 'endsWith', value: 'acme.com'},
              {field: 'subject', op: 'contains', value: 'OTP'},
            ],
            extractors: [{source: 'subject', method: 'regex', pattern: '\\d{6}'}],
          },
        ],
      };
    };

    test('all: both must match', () => {
      const p = new EmailParser(twoMatcherRule('all'));
      expect(p.canParse(makeEmail({from: [{email: 'x@acme.com'}], subject: 'OTP 123456'}))).toBe(true);
      expect(p.canParse(makeEmail({from: [{email: 'x@acme.com'}], subject: 'Hello'}))).toBe(false);
      expect(p.canParse(makeEmail({from: [{email: 'x@other.com'}], subject: 'OTP 123456'}))).toBe(false);
    });

    test('any: at least one must match', () => {
      const p = new EmailParser(twoMatcherRule('any'));
      expect(p.canParse(makeEmail({from: [{email: 'x@acme.com'}], subject: 'Hello'}))).toBe(true);
      expect(p.canParse(makeEmail({from: [{email: 'x@other.com'}], subject: 'OTP 123456'}))).toBe(true);
      expect(p.canParse(makeEmail({from: [{email: 'x@other.com'}], subject: 'Hello'}))).toBe(false);
    });

    test('defaults to all when matchMode is omitted', () => {
      const p = new EmailParser({
        rules: [
          {
            matchers: [
              {field: 'sender.email', op: 'endsWith', value: 'acme.com'},
              {field: 'subject', op: 'contains', value: 'OTP'},
            ],
            extractors: [{source: 'subject', method: 'regex', pattern: '\\d{6}'}],
          },
        ],
      });
      expect(p.canParse(makeEmail({from: [{email: 'x@acme.com'}], subject: 'Hello'}))).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Regex extractor
// ---------------------------------------------------------------------------

describe('regex extractor', () => {
  const parser = new EmailParser({
    rules: [
      {
        matchers: [{field: 'sender.email', op: 'endsWith', value: 'acme.com'}],
        extractors: [{source: 'subject', method: 'regex', pattern: '\\d{6}'}],
      },
    ],
  });
  const email = (subject: string) => makeEmail({from: [{email: 'x@acme.com'}], subject});

  test('extracts code from subject', () => {
    expect(parser.tryParse(email('Your code is 123456'))).toMatchObject({
      success: true,
      result: '123456',
    });
  });

  test('returns not-found when no match', () => {
    expect(parser.tryParse(email('No code here'))).toMatchObject({
      success: false,
      error: 'not-found',
    });
  });

  test('returns ambiguous when multiple matches', () => {
    expect(parser.tryParse(email('Code 123456 or 654321'))).toMatchObject({
      success: false,
      error: 'ambiguous',
    });
  });

  test('extracts code from body', () => {
    const bodyParser = new EmailParser({
      rules: [
        {
          matchers: [{field: 'sender.email', op: 'endsWith', value: 'acme.com'}],
          extractors: [{source: 'body', method: 'regex', pattern: '\\d{6}'}],
        },
      ],
    });
    expect(
      bodyParser.tryParse(makeEmail({from: [{email: 'x@acme.com'}], content: '<p>Code: 999888</p>'}))
    ).toMatchObject({success: true, result: '999888'});
  });

  test('uses captureGroup when specified', () => {
    const captureParser = new EmailParser({
      rules: [
        {
          matchers: [{field: 'sender.email', op: 'endsWith', value: 'acme.com'}],
          extractors: [{source: 'subject', method: 'regex', pattern: 'code[:\\s]+(\\d{6})', captureGroup: 1}],
        },
      ],
    });
    expect(captureParser.tryParse(makeEmail({from: [{email: 'x@acme.com'}], subject: 'code: 555444'}))).toMatchObject({
      success: true,
      result: '555444',
    });
  });
});

// ---------------------------------------------------------------------------
// XPath extractor
// ---------------------------------------------------------------------------

describe('xpath extractor', () => {
  const parser = new EmailParser({
    rules: [
      {
        matchers: [{field: 'sender.email', op: 'endsWith', value: 'acme.com'}],
        extractors: [{source: 'body', method: 'xpath', expression: "//p[@class='otp']"}],
      },
    ],
  });
  const email = (content: string) => makeEmail({from: [{email: 'x@acme.com'}], content});

  test('extracts text from matched node', () => {
    expect(parser.tryParse(email('<html><body><p class="otp">123456</p></body></html>'))).toMatchObject({
      success: true,
      result: '123456',
    });
  });

  test('returns not-found when xpath matches nothing', () => {
    expect(parser.tryParse(email('<html><body><p>no match</p></body></html>'))).toMatchObject({
      success: false,
      error: 'not-found',
    });
  });

  test('returns ambiguous when xpath matches multiple nodes', () => {
    expect(
      parser.tryParse(email('<html><body><p class="otp">123456</p><p class="otp">654321</p></body></html>'))
    ).toMatchObject({success: false, error: 'ambiguous'});
  });
});

// ---------------------------------------------------------------------------
// CSS extractor
// ---------------------------------------------------------------------------

describe('css extractor', () => {
  const parser = new EmailParser({
    rules: [
      {
        matchers: [{field: 'sender.email', op: 'endsWith', value: 'acme.com'}],
        extractors: [{source: 'body', method: 'css', selector: '.otp-code'}],
      },
    ],
  });
  const email = (content: string) => makeEmail({from: [{email: 'x@acme.com'}], content});

  test('extracts textContent from matched element', () => {
    expect(parser.tryParse(email('<html><body><span class="otp-code">123456</span></body></html>'))).toMatchObject({
      success: true,
      result: '123456',
    });
  });

  test('extracts attribute when specified', () => {
    const linkParser = new EmailParser({
      rules: [
        {
          matchers: [{field: 'sender.email', op: 'endsWith', value: 'acme.com'}],
          extractors: [{source: 'body', method: 'css', selector: 'a.sign-in', attribute: 'href'}],
        },
      ],
    });
    expect(
      linkParser.tryParse(
        makeEmail({
          from: [{email: 'x@acme.com'}],
          content: '<html><body><a class="sign-in" href="https://acme.com/login?token=abc">Sign in</a></body></html>',
        })
      )
    ).toMatchObject({success: true, result: 'https://acme.com/login?token=abc'});
  });

  test('returns not-found when selector matches nothing', () => {
    expect(parser.tryParse(email('<html><body><p>no match</p></body></html>'))).toMatchObject({
      success: false,
      error: 'not-found',
    });
  });

  test('returns ambiguous when selector matches multiple elements', () => {
    expect(
      parser.tryParse(
        email('<html><body><span class="otp-code">111222</span><span class="otp-code">333444</span></body></html>')
      )
    ).toMatchObject({success: false, error: 'ambiguous'});
  });
});

// ---------------------------------------------------------------------------
// Multi-extractor fallback
// ---------------------------------------------------------------------------

describe('multi-extractor fallback', () => {
  const parser = new EmailParser({
    rules: [
      {
        matchers: [{field: 'sender.email', op: 'endsWith', value: 'acme.com'}],
        extractors: [
          {source: 'subject', method: 'regex', pattern: '\\d{6}'},
          {source: 'body', method: 'regex', pattern: '\\d{6}'},
        ],
      },
    ],
  });

  test('uses first extractor when it succeeds', () => {
    expect(
      parser.tryParse(
        makeEmail({
          from: [{email: 'x@acme.com'}],
          subject: '123456',
          content: '<p>654321</p>',
        })
      )
    ).toMatchObject({success: true, result: '123456'});
  });

  test('falls back to second extractor when first fails', () => {
    expect(
      parser.tryParse(
        makeEmail({
          from: [{email: 'x@acme.com'}],
          subject: 'no code here',
          content: '<p>654321</p>',
        })
      )
    ).toMatchObject({success: true, result: '654321'});
  });

  test('returns not-found when all extractors fail', () => {
    expect(
      parser.tryParse(
        makeEmail({
          from: [{email: 'x@acme.com'}],
          subject: 'no code here',
          content: '<p>no code here either</p>',
        })
      )
    ).toMatchObject({success: false, error: 'not-found'});
  });
});

// ---------------------------------------------------------------------------
// No matching rule
// ---------------------------------------------------------------------------

describe('no matching rule', () => {
  const parser = new EmailParser({
    rules: [
      {
        matchers: [{field: 'sender.email', op: 'endsWith', value: 'acme.com'}],
        extractors: [{source: 'subject', method: 'regex', pattern: '\\d{6}'}],
      },
    ],
  });

  test('canParse returns false', () => {
    expect(parser.canParse(makeEmail({from: [{email: 'x@other.com'}]}))).toBe(false);
  });

  test('tryParse returns not-found', () => {
    expect(parser.tryParse(makeEmail({from: [{email: 'x@other.com'}], subject: '123456'}))).toMatchObject({
      success: false,
      error: 'not-found',
    });
  });
});
