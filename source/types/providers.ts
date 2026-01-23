export const PROVIDERS = {
  FASTMAIL: {
    id: 'fastmail',
    name: 'Fastmail',
    type: 'JMAP',
    jmapUrl: 'https://api.fastmail.com/jmap/api/',
    sessionUrl: 'https://api.fastmail.com/jmap/session',
    authType: 'bearer', // API token
  },
  GMAIL: {
    id: 'gmail',
    name: 'Gmail',
    type: 'GMAIL_API',
    authType: 'oauth2',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  },
  IMAP: {
    id: 'imap',
    name: 'Generic IMAP',
    type: 'IMAP',
    authType: 'password',
    requiresNativeHost: true,
  },
} as const;
