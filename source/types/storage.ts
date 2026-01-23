export interface StorageSchema {
  fastmailApiKey: string;

  enableLogging: boolean;
  visitCount: number;
}

export const defaultStorage: StorageSchema = {
  fastmailApiKey: '',

  enableLogging: false,
  visitCount: 0,
};
