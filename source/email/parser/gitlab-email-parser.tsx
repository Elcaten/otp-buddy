import {EmailParser, Email} from '../types';

export const GitlabEmailParser: EmailParser = {
  canParse: (email: Email) =>
    email.from?.some((from) => from.email?.endsWith('gitlab.com')) ?? false,
  parse: (email: Email) => new RegExp(/\d{6}/g).exec(email.content ?? '')?.[0],
};
