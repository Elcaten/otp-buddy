export interface StorageSchema {
  fastmailApiKey: string;
  provider: string;

  enableLogging: boolean;
  visitCount: number;
}

export const defaultStorage: StorageSchema = {
  fastmailApiKey: '',
  provider: 'fastmail',

  enableLogging: false,
  visitCount: 0,
};
