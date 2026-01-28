import {Email, EmailParser} from '../types';
import {ClaudeEmailParser} from './claude-email-parser';
import {GitlabEmailParser} from './gitlab-email-parser';
import {PolymarketEmailParser} from './polymarket-email-parser';

const EMAIL_PARSERS: EmailParser[] = [
  GitlabEmailParser,
  ClaudeEmailParser,
  PolymarketEmailParser,
];

export const emailParser: EmailParser = {
  canParse: (email: Email) =>
    EMAIL_PARSERS.some((parser) => parser.canParse(email)),
  parse: (email: Email) =>
    EMAIL_PARSERS.find((parser) => parser.canParse(email))?.parse(email),
};
