/**
 * Sentry setup for browser extension (shared-environment safe).
 *
 * Uses manual BrowserClient + Scope instead of Sentry.init() to avoid
 * polluting global state. See:
 * https://docs.sentry.io/platforms/javascript/best-practices/shared-environments/
 */

import {BrowserClient, defaultStackParser, getDefaultIntegrations, makeFetchTransport, Scope} from '@sentry/browser';
import {BrowserClientOptions} from 'node_modules/@sentry/browser/build/npm/types/client';

const DSN = import.meta.env.VITE_SENTRY_DSN;

let scope: Scope | undefined;

const GLOBAL_STATE_INTEGRATIONS = [
  'BrowserApiErrors',
  'BrowserSession',
  'Breadcrumbs',
  'ConversationId',
  'GlobalHandlers',
  'FunctionToString',
];

const beforeSendLog: BrowserClientOptions['beforeSendLog'] = (event) => {
  const SAFE_KEYS = new Set([
    'source',
    'sentry.release',
    'sentry.environment',
    'sentry.sdk.name',
    'sentry.sdk.version',
    'pattern',
    'timestamp',
    'expiryDate',
  ]);
  if (event.attributes) {
    for (const key of Object.keys(event.attributes)) {
      if (!key.startsWith('sentry.') && !SAFE_KEYS.has(key)) {
        delete event.attributes[key];
      }
    }
  }
  return event;
};

export function initSentry(): void {
  if (scope || !DSN) return;

  const integrations = getDefaultIntegrations({}).filter((i) => !GLOBAL_STATE_INTEGRATIONS.includes(i.name));

  const client = new BrowserClient({
    dsn: DSN,
    transport: makeFetchTransport,
    stackParser: defaultStackParser,
    integrations,
    enableLogs: true,
    beforeSendLog: beforeSendLog,
  });

  scope = new Scope();
  scope.setClient(client);
  client.init();
}

export function getSentryScope(): Scope | undefined {
  return scope;
}
