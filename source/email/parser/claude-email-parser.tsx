import {EmailParser, Email} from '../types';

export const ClaudeEmailParser: EmailParser = {
  canParse: (email: Email) =>
    email.from?.some((from) => from.email?.endsWith('anthropic.com')) ?? false,
  tryParse: (email: Email) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(email.content ?? '', 'text/html');
    const signInLinks = Array.from(doc.querySelectorAll('a')).filter((link) =>
      new RegExp(/sign/gi).test(link.text)
    );

    if (!signInLinks) {
      return {success: false, error: 'not-found'};
    }

    if (signInLinks.length !== 1) {
      return {success: false, error: 'ambiguous'};
    }

    const signInLink = signInLinks[0]!.getAttribute('href') ?? '';
    return {
      success: true,
      result: signInLink,
    };
  },
};
