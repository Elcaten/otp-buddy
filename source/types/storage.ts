export interface StorageSchema {
  provider: 'fastmail' | 'gmail' | 'imap';

  fastmailApiKey: string;
  fastmailAccountId: string;

  gmailRefreshToken: string;

  enableLogging: boolean;
  visitCount: number;
}

export const defaultStorage: StorageSchema = {
  provider: 'fastmail',

  fastmailApiKey: '',
  fastmailAccountId: '',

  gmailRefreshToken: '',

  enableLogging: true,
  visitCount: 0,
};
