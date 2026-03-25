export type EmailParserConfig = {
  rules: EmailParserRule[];
};

export type EmailParserRule = {
  name?: string;
  matchers: EmailMatcher[];
  matchMode?: 'all' | 'any'; // defaults to "all"
  extractors: OtpExtractor[]; // tried in order, first success wins
};

export type EmailMatcher = {
  field: 'sender.email' | 'sender.name' | 'subject' | 'body';
  op: 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'matches';
  value: string;
};

export type RegexOtpExtractor = {
  source: 'subject' | 'body';
  method: 'regex';
  pattern: string;
  captureGroup?: number;
};

export type XpathOtpExtractor = {
  source: 'body';
  method: 'xpath';
  expression: string;
};

export type CssOtpExtractor = {
  source: 'body';
  method: 'css';
  selector: string;
  attribute?: string;
};

export type OtpExtractor = RegexOtpExtractor | XpathOtpExtractor | CssOtpExtractor;

export const emailParserConfig: EmailParserConfig = {
  rules: [
    {
      name: 'Claude',
      matchers: [{field: 'sender.email', op: 'endsWith', value: 'anthropic.com'}],
      extractors: [
        {source: 'body', method: 'css', selector: 'a[href^="https://claude.ai/magic-link"]', attribute: 'href'},
      ],
    },
    {
      name: 'Booking',
      matchers: [{field: 'sender.email', op: 'endsWith', value: 'booking.com'}],
      extractors: [
        {source: 'subject', method: 'regex', pattern: '\\b[A-Za-z0-9]{6}\\b'},
      ],
    },
    {
      name: 'Polymarket',
      matchers: [{field: 'sender.name', op: 'contains', value: 'Polymarket'}],
      extractors: [{source: 'subject', method: 'regex', pattern: '\\d{6}'}],
    },
    {
      name: 'Gitlab',
      matchers: [{field: 'sender.email', op: 'endsWith', value: 'gitlab.com'}],
      // find any leaf element whose entire text content is exactly 6 digits
      extractors: [
        {
          source: 'body',
          method: 'xpath',
          expression:
            "//*[not(*)][string-length(normalize-space()) = 6][translate(normalize-space(), '0123456789', '') = '']",
        },
      ],
    },
    {
      name: 'Fallback',
      matchers: [{field: 'sender.email', op: 'contains', value: '@'}],
      extractors: [
        {source: 'subject', method: 'regex', pattern: '\\d{6}'},
        {
          source: 'body',
          method: 'xpath',
          expression:
            "//*[not(*)][string-length(normalize-space()) = 6][translate(normalize-space(), '0123456789', '') = '']",
        },
      ],
    },
  ],
};
