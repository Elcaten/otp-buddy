export type Email = {
  id: string;
  subject: string | undefined;
  from: EmailAddress[] | undefined;
  content: string | undefined;
};

export type EmailAddress = {
  name?: string | undefined;
  email?: string | undefined;
};

export type EmailFetcher = {
  fetchRecentEmails: () => Promise<Email[]>;
};

export type EmailParser = {
  canParse: (email: Email) => boolean;
  parse: (email: Email) => string | undefined;
};
