import * as oauth from 'oauth4webapi';
import browser from 'webextension-polyfill';

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

export async function getAccessToken(): Promise<oauth.TokenEndpointResponse> {
  const code_verifier = oauth.generateRandomCodeVerifier();

  const redirectURL = await authorize({code_verifier});
  const result = await validate({redirectURL, code_verifier});

  return result;
}
