import {EmailParser, Email} from '../types';

export const ClaudeEmailParser: EmailParser = {
  canParse: (email: Email) =>
    email.from?.some((from) => from.email?.endsWith('anthropic.com')) ?? false,
  parse: (email: Email) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(email.content ?? '', 'text/html');
    const signInLink = Array.from(doc.querySelectorAll('a')).find((link) =>
      new RegExp(/sign/gi).test(link.text)
    );

    return signInLink?.getAttribute('href') ?? undefined;
  },
};
