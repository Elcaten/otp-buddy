/**
 * Gmail test helper using gmail-tester.
 *
 * Reads credentials and token from CI secrets (JSON strings in env vars).
 * Provides inbox polling and email sending for test setup.
 */
import * as gmail from 'gmail-tester';
import {e2eEnv} from './env';

function getCredentials(): gmail.Credentials {
  return JSON.parse(e2eEnv.gmailCredentialsJson) as gmail.Credentials;
}

function getToken(): Record<string, unknown> {
  return JSON.parse(e2eEnv.gmailTokenJson) as Record<string, unknown>;
}

/**
 * Poll Gmail inbox for an email matching the given criteria.
 * Returns matching emails or empty array if none found within timeout.
 */
export async function waitForGmailEmail(options: {
  from?: string;
  subject?: string;
  after?: Date;
  waitTimeSec?: number;
  maxWaitTimeSec?: number;
}): Promise<gmail.Email[]> {
  return gmail.check_inbox(getCredentials(), getToken(), {
    to: e2eEnv.testEmailGmail,
    from: options.from,
    subject: options.subject,
    after: options.after ?? new Date(Date.now() - 10 * 60 * 1000),
    include_body: true,
    wait_time_sec: options.waitTimeSec ?? 10,
    max_wait_time_sec: options.maxWaitTimeSec ?? 120,
  });
}

/**
 * Get recent emails from Gmail inbox without waiting.
 */
export async function getGmailMessages(options?: {
  from?: string;
  subject?: string;
  after?: Date;
}): Promise<gmail.Email[]> {
  return gmail.get_messages(getCredentials(), getToken(), {
    to: e2eEnv.testEmailGmail,
    from: options?.from,
    subject: options?.subject,
    after: options?.after ?? new Date(Date.now() - 60 * 60 * 1000),
    include_body: true,
  });
}

/**
 * Send an email to the test Gmail address (self-send) via the Gmail API.
 * Uses the refresh token + credentials to get an access token, then sends via Gmail API.
 */
export async function sendTestEmailToGmail(options: {
  subject: string;
  htmlBody: string;
  from?: string;
  fromName?: string;
  to?: string;
}): Promise<void> {
  const credentials = getCredentials();
  const token = getToken();

  const refreshToken = token.refresh_token as string;
  const clientId = credentials.installed.client_id;
  const clientSecret = credentials.installed.client_secret;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = (await tokenResponse.json()) as {access_token: string};
  const accessToken = tokenData.access_token;

  const fromEmail = options.from ?? e2eEnv.testEmailGmail;
  const fromName = options.fromName;
  const fromAddr = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
  const toAddr = options.to ?? e2eEnv.testEmailGmail;

  const rawMessage = [
    `From: ${fromAddr}`,
    `To: ${toAddr}`,
    `Subject: ${options.subject}`,
    `Content-Type: text/html; charset=utf-8`,
    '',
    options.htmlBody,
  ].join('\r\n');

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({raw: encodedMessage}),
  });

  if (!sendResponse.ok) {
    const errorText = await sendResponse.text();
    throw new Error(`Failed to send Gmail test email: ${sendResponse.status} ${errorText}`);
  }
}
