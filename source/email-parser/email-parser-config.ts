import config from './email-parser-config.json';

import type {EmailParserConfig} from './email-parser-config.types';

export type {
  CssOtpExtractor,
  EmailMatcher,
  EmailParserConfig,
  EmailParserRule,
  OtpExtractor,
  RegexOtpExtractor,
  XpathOtpExtractor,
} from './email-parser-config.types';

export const emailParserConfig = config as EmailParserConfig;
