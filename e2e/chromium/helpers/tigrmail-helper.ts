/**
 * Tigrmail test helper — disposable email inboxes for E2E tests.
 *
 * Creates temporary inboxes via the Tigrmail API and polls for incoming
 * messages.  Replaces the previous Fastmail JMAP helper so that tests
 * no longer need a permanent Fastmail account.
 *
 * @see https://docs.tigrmail.com
 */
import {Tigrmail, type MessageFilter} from 'tigrmail';
import {e2eEnv} from './env';

let client: Tigrmail | null = null;

function getClient(): Tigrmail {
  if (!client) {
    client = new Tigrmail({token: e2eEnv.tigrmailToken});
  }
  return client;
}

/**
 * Create a fresh disposable inbox. Returns the email address string.
 * Each test should call this to get an isolated inbox.
 */
export async function createTigrmailInbox(): Promise<string> {
  return getClient().createEmailAddress();
}

/**
 * Poll a Tigrmail inbox until a matching message arrives.
 * Returns the full EmailMessage (from, to, subject, body).
 */
export async function waitForTigrmailEmail(filter: MessageFilter) {
  return getClient().pollNextMessage(filter);
}
