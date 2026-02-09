import * as oauth from 'oauth4webapi';
import {launchOAuthFlow} from './launch-oauth-flow';
import {getRedirectURI} from './get-redirect-uri';

const CLIENT_ID =
  '56620181367-ca818gh7r9rgs9nd0s054su4o35hbli2.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const ISSUER = 'https://accounts.google.com';
const ALGORITHM = 'oauth2';

const client: oauth.Client = {
  client_id: CLIENT_ID,
};

export async function validate({
  redirectURI,
  redirectURL,
  code_verifier,
}: {
  redirectURI: string;
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
    oauth.None(),
    params,
    redirectURI,
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
  redirectURI,
  code_verifier,
}: {
  redirectURI: string;
  code_verifier: string;
}): Promise<string> {
  const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
  let authURL = 'https://accounts.google.com/o/oauth2/auth';
  authURL += `?client_id=${CLIENT_ID}`;
  authURL += `&response_type=code`;
  authURL += `&redirect_uri=${encodeURIComponent(redirectURI)}`;
  authURL += `&scope=${encodeURIComponent(scopes.join(' '))}`;

  const code_challenge_method = 'S256';
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);
  authURL += `&code_challenge=${code_challenge}`;
  authURL += `&code_challenge_method=${code_challenge_method}`;

  return launchOAuthFlow(authURL);
}

export async function getAccessToken(): Promise<oauth.TokenEndpointResponse> {
  const redirectURI = await getRedirectURI();
  const code_verifier = oauth.generateRandomCodeVerifier();

  const redirectURL = await authorize({redirectURI, code_verifier});
  const result = await validate({redirectURI, redirectURL, code_verifier});

  return result;
}
