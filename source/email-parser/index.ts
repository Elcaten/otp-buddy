import {Email, EmailParser} from '../types/email';
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
  tryParse: (email: Email) => {
    const parser = EMAIL_PARSERS.find((p) => p.canParse(email));
    if (!parser) {
      return {success: false, error: 'not-found'};
    }
    return parser.tryParse(email);
  },
};
