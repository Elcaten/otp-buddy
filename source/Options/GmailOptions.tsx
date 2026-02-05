import {JSX} from 'react';
import browser from 'webextension-polyfill';
import * as oauth from 'oauth4webapi';

export const GmailOptions = (): JSX.Element => <p>GmailOptions</p>;

const CLIENT_ID =
  '56620181367-emp047d1659ob89hb5cga5bmn5k66gj2.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const ISSUER = 'https://accounts.google.com';
const ALGORITHM = 'oauth2';
const REDIRECT_URI = browser.identity.getRedirectURL();

const client: oauth.Client = {
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
};

async function validate({
  redirectURL,
  code_verifier,
}: {
  redirectURL: string;
  code_verifier: string;
}): Promise<oauth.TokenEndpointResponse> {
  const as = await oauth
    .discoveryRequest(new URL(ISSUER), {algorithm: ALGORITHM})
    .then((response) =>
      oauth.processDiscoveryResponse(new URL(ISSUER), response)
    );

  const params = oauth.validateAuthResponse(as, client, new URL(redirectURL));

  const response = await oauth.authorizationCodeGrantRequest(
    as,
    client,
    oauth.ClientSecretPost(CLIENT_SECRET),
    params,
    REDIRECT_URI,
    code_verifier
  );

  const result = await oauth.processAuthorizationCodeResponse(
    as,
    client,
    response
  );

  return result;
}

async function authorize({
  code_verifier,
}: {
  code_verifier: string;
}): Promise<string> {
  const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
  let authURL = 'https://accounts.google.com/o/oauth2/auth';
  authURL += `?client_id=${CLIENT_ID}`;
  authURL += `&response_type=code`;
  authURL += `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  authURL += `&scope=${encodeURIComponent(scopes.join(' '))}`;

  const code_challenge_method = 'S256';
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);
  authURL += `&code_challenge=${code_challenge}`;
  authURL += `&code_challenge_method=${code_challenge_method}`;

  return browser.identity.launchWebAuthFlow({
    interactive: true,
    url: authURL,
  });
}

async function getAccessToken(): Promise<oauth.TokenEndpointResponse> {
  const code_verifier = oauth.generateRandomCodeVerifier();

  const redirectURL = await authorize({code_verifier});
  const result = await validate({redirectURL, code_verifier});

  return result;
}

async function getRecentEmails({access_token}: {access_token: string}) {
  // 1. List messages from the last hour
  // 'newer_than:1h' handles the timing logic
  // We leave out 'labelIds' to search across the whole account (all inboxes/folders)
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5`;

  try {
    const listResponse = await fetch(listUrl, {
      headers: {Authorization: `Bearer ${access_token}`},
    });
    const listData = await listResponse.json();

    if (!listData.messages) {
      console.log('No messages found messages for query');
      return [];
    }

    // 2. Fetch full details for each message ID found
    const detailPromises = listData.messages.map(async (msg) => {
      const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
      const detailRes = await fetch(detailUrl, {
        headers: {Authorization: `Bearer ${access_token}`},
      });
      return detailRes.json();
    });

    const fullMessages = await Promise.all(detailPromises);

    // Log subjects of the found emails
    fullMessages.forEach((m) => {
      const subject = m.payload.headers.find(
        (h) => h.name === 'Subject'
      )?.value;
      console.log(`Email Found: ${subject}`);
    });

    return fullMessages;
  } catch (error) {
    console.error('Failed to fetch Gmail messages:', error);
  }
}

getAccessToken()
  .then((r) => getRecentEmails({access_token: r.access_token}))
  .catch(console.error);
