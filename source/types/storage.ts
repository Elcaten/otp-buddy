export interface StorageSchema {
  provider: 'fastmail' | 'gmail' | 'imap';

  fastmailApiKey: string;
  fastmailAccountId: string;

  enableLogging: boolean;
  visitCount: number;
}

export const defaultStorage: StorageSchema = {
  provider: 'fastmail',

  fastmailApiKey: '',
  fastmailAccountId: '',

  enableLogging: true,
  visitCount: 0,
};
