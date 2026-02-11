import * as oauth from 'oauth4webapi';
import browser from 'webextension-polyfill';
import {isOAuthLaunchResponse, OAuthLaunchMessage} from '../../types/messages';
import {env} from '../../utils/env';

async function buildAuthURL({
  client_id,
  redirect_uri,
  code_verifier,
}: {
  client_id: string;
  redirect_uri: string;
  code_verifier: string;
}): Promise<string> {
  let authURL = 'https://accounts.google.com/o/oauth2/auth';

  const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
  const code_challenge_method = 'S256';
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);

  authURL += `?client_id=${client_id}`;
  authURL += `&response_type=code`;
  authURL += `&redirect_uri=${encodeURIComponent(redirect_uri)}`;
  authURL += `&scope=${encodeURIComponent(scopes.join(' '))}`;
  authURL += `&code_challenge=${code_challenge}`;
  authURL += `&code_challenge_method=${code_challenge_method}`;

  return authURL;
}

async function requestToken({
  client,
  clientAuth,
  redirect_uri,
  code_verifier,
  redirectUrlSearchParams,
}: {
  client: oauth.Client;
  clientAuth: oauth.ClientAuth;
  redirect_uri: string;
  code_verifier: string;
  redirectUrlSearchParams: URLSearchParams;
}): Promise<oauth.TokenEndpointResponse> {
  const ISSUER = 'https://accounts.google.com';
  const ALGORITHM = 'oauth2';

  const authServerMetadata = await oauth
    .discoveryRequest(new URL(ISSUER), {algorithm: ALGORITHM})
    .then((response) =>
      oauth.processDiscoveryResponse(new URL(ISSUER), response)
    );

  const params = oauth.validateAuthResponse(
    authServerMetadata,
    client,
    redirectUrlSearchParams
  );

  const response = await oauth.authorizationCodeGrantRequest(
    authServerMetadata,
    client,
    clientAuth,
    params,
    redirect_uri,
    code_verifier
  );

  const result = await oauth.processAuthorizationCodeResponse(
    authServerMetadata,
    client,
    response
  );

  return result;
}

async function getToken_chrome_firefox(): Promise<oauth.TokenEndpointResponse> {
  const redirect_uri = browser.identity.getRedirectURL();
  const code_verifier = oauth.generateRandomCodeVerifier();
  const client_id = env.OTP_BUDDY_WEB_CLIENT_ID;
  const client_secret = env.OTP_BUDDY_WEB_CLIENT_SECRET;
  const client: oauth.Client = {
    client_id: client_id,
    client_secret: client_secret,
  };
  const clientAuth = oauth.ClientSecretPost(client_secret);

  const authURL = await buildAuthURL({
    client_id: client_id,
    redirect_uri,
    code_verifier,
  });
  const redirectUrlWithParams = await browser.identity.launchWebAuthFlow({
    interactive: true,
    url: authURL,
  });
  const tokenResponse = await requestToken({
    client,
    clientAuth,
    redirect_uri,
    redirectUrlSearchParams: new URL(redirectUrlWithParams).searchParams,
    code_verifier,
  });

  return tokenResponse;
}

async function getToken_safari(): Promise<oauth.TokenEndpointResponse> {
  // Same as associated URL type in main app Info.plist
  const redirect_uri = 'com.elcaten.otpbuddy:/';
  const code_verifier = oauth.generateRandomCodeVerifier();
  const client_id = env.OTP_BUDDY_SAFARI_CLIENT_ID;
  const client: oauth.Client = {
    client_id: client_id,
  };
  const clientAuth = oauth.None();

  const authURL = await buildAuthURL({
    client_id: client_id,
    redirect_uri,
    code_verifier,
  });

  const backgroundResponse = await browser.runtime.sendMessage({
    type: 'OAUTH_LAUNCH',
    authURL,
  } satisfies OAuthLaunchMessage);
  if (!isOAuthLaunchResponse(backgroundResponse)) {
    throw new Error('Failed to launch OAuth flow');
  }
  if (backgroundResponse?.error) {
    throw new Error(backgroundResponse.error);
  }
  if (backgroundResponse?.redirectURL == null) {
    throw new Error('No redirect URL from OAuth flow');
  }
  const redirectUrlWithParams = backgroundResponse.redirectURL;

  const tokenResponse = await requestToken({
    client,
    clientAuth,
    redirect_uri,
    redirectUrlSearchParams: new URL(redirectUrlWithParams).searchParams,
    code_verifier,
  });

  return tokenResponse;
}

export async function getAccessToken(): Promise<oauth.TokenEndpointResponse> {
  if (typeof browser.identity?.getRedirectURL === 'function') {
    return getToken_chrome_firefox();
  }

  return getToken_safari();
}
