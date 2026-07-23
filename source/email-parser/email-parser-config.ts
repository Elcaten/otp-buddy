import validateConfig from './email-parser-config.validator.js';

import type {EmailParserConfig} from './email-parser-config.types';

export type {
  CssOtpExtractor,
  EmailMatcher,
  EmailParserConfig,
  EmailParserRule,
  OtpExtractor,
  RegexOtpExtractor,
  XpathOtpExtractor,
} from './email-parser-config.types';

const MAX_CONFIG_SIZE_BYTES = 256_000;

type LoadEmailParserConfigOptions = {
  isDevelopment?: boolean;
  fetcher?: typeof fetch;
  localConfig?: unknown;
  configUrl?: string;
};

export class EmailParserConfigError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'EmailParserConfigError';
  }
}

export async function loadEmailParserConfig(
  options: LoadEmailParserConfigOptions = {}
): Promise<EmailParserConfig> {
  const isDevelopment = options.isDevelopment ?? import.meta.env.DEV;

  if (isDevelopment) {
    return parseEmailParserConfig(options.localConfig ?? __EMAIL_PARSER_CONFIG__);
  }

  const configUrl = options.configUrl ?? import.meta.env.VITE_EMAIL_PARSER_CONFIG_URL;
  if (!configUrl) {
    throw new EmailParserConfigError('Email parser configuration URL is not configured.');
  }

  const fetcher = options.fetcher ?? fetch;
  let response: Response;

  try {
    response = await fetcher(configUrl, {
      cache: 'no-cache',
      credentials: 'omit',
    });
  } catch (error) {
    throw new EmailParserConfigError('Unable to download email parser rules.', {cause: error});
  }

  if (!response.ok) {
    throw new EmailParserConfigError(`Unable to download email parser rules (HTTP ${response.status}).`);
  }

  let body: string;
  try {
    body = await response.text();
  } catch (error) {
    throw new EmailParserConfigError('Unable to download email parser rules.', {cause: error});
  }

  if (new TextEncoder().encode(body).byteLength > MAX_CONFIG_SIZE_BYTES) {
    throw new EmailParserConfigError('Email parser rules exceed the maximum allowed size.');
  }

  let config: unknown;
  try {
    config = JSON.parse(body);
  } catch (error) {
    throw new EmailParserConfigError('Email parser rules contain invalid JSON.', {cause: error});
  }

  return parseEmailParserConfig(config);
}

function parseEmailParserConfig(config: unknown): EmailParserConfig {
  if (!validateConfig(config)) {
    throw new EmailParserConfigError('Email parser rules do not match the required schema.', {
      cause: validateConfig.errors,
    });
  }

  return config as EmailParserConfig;
}
