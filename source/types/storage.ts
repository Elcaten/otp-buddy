export interface StorageSchema {
  provider: 'fastmail' | 'gmail';

  fastmailApiKey: string;
  fastmailAccountId: string;

  gmailToken: string;
  gmailTokenTimestamp: number;

  enableLogging: boolean;
  visitCount: number;
}

export const defaultStorage: StorageSchema = {
  provider: 'fastmail',

  fastmailApiKey: '',
  fastmailAccountId: '',

  gmailToken: '',
  gmailTokenTimestamp: 0,

  enableLogging: true,
  visitCount: 0,
};
