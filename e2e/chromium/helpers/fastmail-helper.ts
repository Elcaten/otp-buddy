/**
 * Fastmail test helper using JMAP API.
 *
 * Provides email sending and inbox reading for test setup/verification.
 */
import {e2eEnv} from './env';

const JMAP_SESSION_URL = 'https://api.fastmail.com/.well-known/jmap';

interface JmapSession {
  apiUrl: string;
  primaryAccounts: Record<string, string>;
}

interface JmapMethodResponse {
  methodResponses: [string, Record<string, unknown>, string][];
}

async function getSession(): Promise<JmapSession> {
  const response = await fetch(JMAP_SESSION_URL, {
    headers: {Authorization: `Bearer ${e2eEnv.fastmailApiKey}`},
  });
  if (!response.ok) {
    throw new Error(`Fastmail session failed: ${response.status}`);
  }
  return response.json() as Promise<JmapSession>;
}

async function jmapRequest(apiUrl: string, methodCalls: unknown[]): Promise<JmapMethodResponse> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${e2eEnv.fastmailApiKey}`,
    },
    body: JSON.stringify({
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail', 'urn:ietf:params:jmap:submission'],
      methodCalls,
    }),
  });
  if (!response.ok) {
    throw new Error(`JMAP request failed: ${response.status}`);
  }
  return response.json() as Promise<JmapMethodResponse>;
}

/**
 * Send a test email to the Fastmail test address (self-send via JMAP submission).
 */
export async function sendTestEmailToFastmail(options: {
  subject: string;
  htmlBody: string;
  fromName?: string;
}): Promise<void> {
  const session = await getSession();
  const accountId = e2eEnv.fastmailAccountId;
  const emailAddress = e2eEnv.testEmailFastmail;
  const fromName = options.fromName ?? 'E2E Test';

  const draftId = `draft-${Date.now()}`;
  const submissionId = `sub-${Date.now()}`;

  await jmapRequest(session.apiUrl, [
    [
      'Email/set',
      {
        accountId,
        create: {
          [draftId]: {
            from: [{name: fromName, email: emailAddress}],
            to: [{email: emailAddress}],
            subject: options.subject,
            htmlBody: [{partId: '1', type: 'text/html'}],
            bodyValues: {
              '1': {value: options.htmlBody},
            },
          },
        },
      },
      'a',
    ],
    [
      'EmailSubmission/set',
      {
        accountId,
        create: {
          [submissionId]: {
            emailId: `#${draftId}`,
            envelope: {
              mailFrom: {email: emailAddress},
              rcptTo: [{email: emailAddress}],
            },
          },
        },
      },
      'b',
    ],
  ]);
}

/**
 * Get recent emails from Fastmail inbox via JMAP.
 */
export async function getFastmailMessages(options?: {
  afterMinutes?: number;
}): Promise<Array<{id: string; subject: string; from: string; htmlBody: string}>> {
  const session = await getSession();
  const accountId = e2eEnv.fastmailAccountId;
  const afterMinutes = options?.afterMinutes ?? 60;
  const afterDate = new Date(Date.now() - afterMinutes * 60 * 1000);

  const result = await jmapRequest(session.apiUrl, [
    [
      'Email/query',
      {
        accountId,
        filter: {after: afterDate.toISOString()},
        sort: [{property: 'receivedAt', isAscending: false}],
        limit: 10,
      },
      'a',
    ],
    [
      'Email/get',
      {
        accountId,
        '#ids': {resultOf: 'a', name: 'Email/query', path: '/ids'},
        properties: ['id', 'subject', 'from', 'bodyValues'],
        fetchHTMLBodyValues: true,
      },
      'b',
    ],
  ]);

  const getResponse = result.methodResponses[1]?.[1] as {
    list: Array<{
      id: string;
      subject: string;
      from: Array<{name: string; email: string}>;
      bodyValues: Record<string, {value: string}>;
    }>;
  };

  return (getResponse?.list ?? []).map((email) => {
    return {
      id: email.id,
      subject: email.subject ?? '',
      from: email.from?.[0]?.email ?? '',
      htmlBody: Object.values(email.bodyValues ?? {})[0]?.value ?? '',
    };
  });
}
