import {log} from '@/utils/logger';
import {Email, EmailParser as IEmailParser} from '../types/email';
import {
  CssOtpExtractor,
  EmailMatcher,
  EmailParserConfig,
  EmailParserRule,
  OtpExtractor,
  RegexOtpExtractor,
  XpathOtpExtractor,
} from './email-parser-config';

type ParseResult = ReturnType<IEmailParser['tryParse']>;

export class EmailParser implements IEmailParser {
  constructor(private readonly config: EmailParserConfig) {}

  canParse(email: Email): boolean {
    return this.config.rules.some((rule) => ruleMatches(rule, email));
  }

  tryParse(email: Email): ParseResult {
    const rule = this.config.rules.find((r) => ruleMatches(r, email));
    if (!rule) return {success: false, error: 'not-found'};
    for (const extractor of rule.extractors) {
      const result = runExtractor(extractor, email);
      // only 'not-found' falls through to the next extractor;
      // 'ambiguous' and 'unexpected' are definitive and short-circuit
      if (result.success || result.error !== 'not-found') return result;
    }
    return {success: false, error: 'not-found'};
  }
}

function ruleMatches(rule: EmailParserRule, email: Email): boolean {
  const mode = rule.matchMode ?? 'all';
  const check = (m: EmailMatcher) => matcherMatches(m, email);
  return mode === 'all' ? rule.matchers.every(check) : rule.matchers.some(check);
}

function matcherMatches(matcher: EmailMatcher, email: Email): boolean {
  const {field, op, value} = matcher;

  if (field === 'sender.email' || field === 'sender.name') {
    const key = field === 'sender.email' ? 'email' : 'name';
    return (email.from ?? []).some((addr) => {
      const str = addr[key];
      return str != null && applyOp(op, str, value);
    });
  }

  const str = field === 'subject' ? (email.subject ?? '') : (email.content ?? '');
  return applyOp(op, str, value);
}

function applyOp(op: EmailMatcher['op'], str: string, value: string): boolean {
  switch (op) {
    case 'contains':
      return str.includes(value);
    case 'startsWith':
      return str.startsWith(value);
    case 'endsWith':
      return str.endsWith(value);
    case 'equals':
      return str === value;
    case 'matches':
      try {
        return new RegExp(value).test(str);
      } catch {
        log.emailParser.error('Invalid regex pattern', {pattern: value});
        return false;
      }
  }
}

function runExtractor(extractor: OtpExtractor, email: Email): ParseResult {
  try {
    switch (extractor.method) {
      case 'regex':
        return runRegexExtractor(extractor, email);
      case 'xpath':
        return runXpathExtractor(extractor, email);
      case 'css':
        return runCssExtractor(extractor, email);
    }
  } catch {
    return {success: false, error: 'unexpected'};
  }
}

function runRegexExtractor(extractor: RegexOtpExtractor, email: Email): ParseResult {
  const text = extractor.source === 'subject' ? (email.subject ?? '') : (email.content ?? '');
  const matches = [...text.matchAll(new RegExp(extractor.pattern, 'g'))];
  if (matches.length === 0) return {success: false, error: 'not-found'};
  if (matches.length > 1) return {success: false, error: 'ambiguous'};
  const group = extractor.captureGroup ?? 0;
  const result = matches[0]![group];
  if (result == null) return {success: false, error: 'not-found'};
  return {success: true, result};
}

function runXpathExtractor(extractor: XpathOtpExtractor, email: Email): ParseResult {
  const doc = new DOMParser().parseFromString(email.content ?? '', 'text/html');
  const xpathResult = doc.evaluate(extractor.expression, doc, null, XPathResult.ANY_TYPE, null);
  const results: string[] = [];
  let node = xpathResult.iterateNext();
  while (node) {
    const text = node.textContent?.trim();
    if (text) results.push(text);
    node = xpathResult.iterateNext();
  }
  if (results.length === 0) return {success: false, error: 'not-found'};
  if (results.length > 1) return {success: false, error: 'ambiguous'};
  return {success: true, result: results[0]!};
}

function runCssExtractor(extractor: CssOtpExtractor, email: Email): ParseResult {
  const doc = new DOMParser().parseFromString(email.content ?? '', 'text/html');
  const elements = Array.from(doc.querySelectorAll(extractor.selector));
  const results = elements
    .map((el) => (extractor.attribute ? el.getAttribute(extractor.attribute) : el.textContent?.trim()))
    .filter((v): v is string => v != null && v.length > 0);
  if (results.length === 0) return {success: false, error: 'not-found'};
  if (results.length > 1) return {success: false, error: 'ambiguous'};
  return {success: true, result: results[0]!};
}
