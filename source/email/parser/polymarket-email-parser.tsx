import {EmailParser, Email} from '../types';

export const PolymarketEmailParser: EmailParser = {
  canParse: (email: Email) =>
    !!email.from?.some((from) =>
      from.name?.toLocaleLowerCase().includes('polymarket')
    ),
  tryParse: (email: Email) => {
    const result = new RegExp(/\d{6}/g).exec(email.subject ?? '');
    if (!result) {
      return {success: false, error: 'not-found'};
    }
    if (result.length > 1) {
      return {success: false, error: 'ambiguous'};
    }
    return {success: true, result: result[0]};
  },
};
