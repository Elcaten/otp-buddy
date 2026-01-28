import {EmailParser, Email} from '../types';

export const PolymarketEmailParser: EmailParser = {
  canParse: (email: Email) =>
    !!email.from?.some((from) =>
      from.name?.toLocaleLowerCase().includes('polymarket')
    ),
  parse: (email: Email) => new RegExp(/\d{6}/g).exec(email.subject ?? '')?.[0],
};
