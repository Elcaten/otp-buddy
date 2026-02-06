import {EmailParser, Email} from '../types';

export const GitlabEmailParser: EmailParser = {
  canParse: (email: Email) =>
    email.from?.some((from) => from.email?.endsWith('gitlab.com')) ?? false,
  tryParse: (email: Email) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(email.content ?? '', 'text/html');
    const leafNodes = document.evaluate(
      '//*[not(*)]',
      doc,
      null,
      XPathResult.ANY_TYPE,
      null
    );

    const foundResults: string[] = [];
    let node = leafNodes.iterateNext();
    while (node) {
      const text = node.textContent;
      const codeMatch = text?.match(/\d{6}/);
      if (codeMatch) {
        foundResults.push(...codeMatch);
      }
      node = leafNodes.iterateNext();
    }

    if (foundResults.length === 0) {
      return {success: false, error: 'not-found'};
    }
    if (foundResults.length > 1) {
      return {success: false, error: 'ambiguous'};
    }
    return {success: true, result: foundResults[0]!};
  },
};
