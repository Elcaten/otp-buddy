import * as oauth from 'oauth4webapi';
import browser from 'webextension-polyfill';
import {isOAuthLaunchResponse, OAuthLaunchMessage} from '../../types/messages';
import {env} from '../../utils/env';
import {log} from '../../utils/logger';
import {clearStorage, getStorage, setStorage} from '../../utils/storage';

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

  const scopes = ['https://www.googleapis.com/auth/gmail.readonly', 'profile', 'email'];
  const code_challenge_method = 'S256';
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);

  authURL += `?client_id=${client_id}`;
  authURL += `&response_type=code`;
  authURL += `&redirect_uri=${encodeURIComponent(redirect_uri)}`;
  authURL += `&scope=${encodeURIComponent(scopes.join(' '))}`;
  authURL += `&code_challenge=${code_challenge}`;
  authURL += `&code_challenge_method=${code_challenge_method}`;
  // these 2 parameters force server to return refresh_token
  authURL += `&access_type=offline`;
  authURL += `&prompt=consent`;

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
    .then((response) => oauth.processDiscoveryResponse(new URL(ISSUER), response));

  const params = oauth.validateAuthResponse(authServerMetadata, client, redirectUrlSearchParams);

  const response = await oauth.authorizationCodeGrantRequest(
    authServerMetadata,
    client,
    clientAuth,
    params,
    redirect_uri,
    code_verifier
  );

  const result = await oauth.processAuthorizationCodeResponse(authServerMetadata, client, response);

  return result;
}

async function refreshToken({
  client,
  clientAuth,
  refresh_token,
}: {
  client: oauth.Client;
  clientAuth: oauth.ClientAuth;
  refresh_token: string;
}): Promise<oauth.TokenEndpointResponse> {
  try {
    const ISSUER = 'https://accounts.google.com';
    const ALGORITHM = 'oauth2';
    const authServerMetadata = await oauth
      .discoveryRequest(new URL(ISSUER), {algorithm: ALGORITHM})
      .then((response) => oauth.processDiscoveryResponse(new URL(ISSUER), response));

    const response = await oauth.refreshTokenGrantRequest(authServerMetadata, client, clientAuth, refresh_token);

    const result = await oauth.processRefreshTokenResponse(authServerMetadata, client, response);

    log.emailFetcher.info('Refresh token succeeded');

    return result;
  } catch (error) {
    log.emailFetcher.error('Refresh token failed', {error});
    throw error;
  }
}

async function revokeToken({
  client,
  clientAuth,
  token,
}: {
  client: oauth.Client;
  clientAuth: oauth.ClientAuth;
  token: string;
}): Promise<void> {
  await clearStorage(['gmailToken', 'gmailTokenTimestamp']);

  const ISSUER = 'https://accounts.google.com';
  const ALGORITHM = 'oauth2';
  const authServerMetadata = await oauth
    .discoveryRequest(new URL(ISSUER), {algorithm: ALGORITHM})
    .then((response) => oauth.processDiscoveryResponse(new URL(ISSUER), response));

  const response = await oauth.revocationRequest(authServerMetadata, client, clientAuth, token);
  const result = await oauth.processRevocationResponse(response);

  log.emailFetcher.info('Token revoked', {result});

  return result;
}

export async function signOut_chrome_firefox(): Promise<void> {
  const client_id = env.OTP_BUDDY_WEB_CLIENT_ID;
  const client_secret = env.OTP_BUDDY_WEB_CLIENT_SECRET;
  const client: oauth.Client = {
    client_id: client_id,
    client_secret: client_secret,
  };
  const clientAuth = oauth.ClientSecretPost(client_secret);

  const token = await getAccessToken({interactive: false});

  await revokeToken({client, clientAuth, token: token.access_token});
}

// type RefreshTokenResult = {type: 'success'; token: oauth.TokenEndpointResponse} | {type: 'error'; error?: unknown};
// async function tryRefreshToken({
//   token,
//   client,
//   clientAuth,
// }: {
//   token: oauth.TokenEndpointResponse;
//   client: oauth.Client;
//   clientAuth: oauth.ClientAuth;
// }): Promise<RefreshTokenResult> {
//   if (!token.refresh_token) {
//     return {type: 'error', error: new Error('No refresh token in token response')};
//   }

//   try {
//     const tokenResponse = await refreshToken({
//       client,
//       clientAuth,
//       refresh_token: token.refresh_token,
//     });
//     log.emailFetcher.info('Token refreshed', {tokenResponse});
//     return {type: 'success', token: tokenResponse};
//   } catch (error) {
//     return {type: 'error', error: error};
//   }
// }

async function getToken_chrome_firefox({interactive}: {interactive: boolean}): Promise<oauth.TokenEndpointResponse> {
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
  log.emailFetcher.info('Requesting access', {authURL});
  const redirectUrlWithParams = await browser.identity.launchWebAuthFlow({
    interactive: interactive,
    url: authURL,
  });
  log.emailFetcher.info('Access granted', {redirectUrlWithParams});

  log.emailFetcher.info('Requesting token', {redirectUrlWithParams});
  const tokenResponse = await requestToken({
    client,
    clientAuth,
    redirect_uri,
    redirectUrlSearchParams: new URL(redirectUrlWithParams).searchParams,
    code_verifier,
  });
  log.emailFetcher.info('Token granted', {tokenResponse});

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
  log.emailFetcher.info('Access granted', {redirectUrlWithParams});

  const tokenResponse = await requestToken({
    client,
    clientAuth,
    redirect_uri,
    redirectUrlSearchParams: new URL(redirectUrlWithParams).searchParams,
    code_verifier,
  });
  log.emailFetcher.info('Token granted', {tokenResponse});

  return tokenResponse;
}

type StoredToken =
  | {type: 'not_found'}
  | {type: 'valid'; token: oauth.TokenEndpointResponse}
  | {type: 'expired'; token: oauth.TokenEndpointResponse};

async function getStoredToken(): Promise<StoredToken> {
  const {gmailToken: gmailTokenString, gmailTokenTimestamp} = await getStorage(['gmailToken', 'gmailTokenTimestamp']);

  let parsedToken: oauth.TokenEndpointResponse | null = null;
  try {
    parsedToken = JSON.parse(gmailTokenString) as oauth.TokenEndpointResponse;
  } catch (error) {
    log.emailFetcher.error('Failed to parse token', {error});
  }

  if (!parsedToken || !parsedToken.expires_in) {
    log.emailFetcher.info('Stored token is invalid', {parsedToken});
    return {type: 'not_found'};
  }

  const expiryDate = new Date(gmailTokenTimestamp + parsedToken.expires_in * 1000);
  const _10_minutes_from_now = new Date(Date.now() + 10 * 60 * 1000);

  if (+expiryDate > +_10_minutes_from_now) {
    log.emailFetcher.info('Stored token is still valid', {expiryDate});
    return {type: 'valid', token: parsedToken};
  }

  log.emailFetcher.info('Stored token is expired', {expiryDate});
  return {type: 'expired', token: parsedToken};
}

async function saveTokenToStorage(token: oauth.TokenEndpointResponse): Promise<void> {
  log.emailFetcher.info('Saving token to storage', {timestamp: Date.now()});
  await setStorage({gmailToken: JSON.stringify(token), gmailTokenTimestamp: Date.now()});
}

export async function getAccessToken({interactive}: {interactive: boolean}): Promise<oauth.TokenEndpointResponse> {
  const storedToken = await getStoredToken();
  if (storedToken.type === 'valid') {
    return storedToken.token;
  }

  const browserType = typeof browser.identity?.getRedirectURL === 'function' ? 'chrome_firefox' : 'safari';

  let client: oauth.Client;
  let clientAuth: oauth.ClientAuth;

  if (browserType === 'chrome_firefox') {
    client = {
      client_id: env.OTP_BUDDY_WEB_CLIENT_ID,
      client_secret: env.OTP_BUDDY_WEB_CLIENT_SECRET,
    };
    clientAuth = oauth.ClientSecretPost(env.OTP_BUDDY_WEB_CLIENT_SECRET);
  } else {
    client = {
      client_id: env.OTP_BUDDY_SAFARI_CLIENT_ID,
    };
    clientAuth = oauth.None();
  }

  if (storedToken.type === 'expired' && storedToken.token.refresh_token) {
    try {
      const tokenResponse = await refreshToken({
        client,
        clientAuth,
        refresh_token: storedToken.token.refresh_token,
      });

      await saveTokenToStorage(tokenResponse);
      return tokenResponse;
    } catch (error) {
      // Ignore errors, we will try to get a new token
      // it's the easiest way to handle expired refresh_token
      log.emailFetcher.error('Failed to refresh token', {error});
    }
  }

  let tokenResponse: oauth.TokenEndpointResponse;

  if (browserType === 'chrome_firefox') {
    tokenResponse = await getToken_chrome_firefox({interactive});
  } else {
    tokenResponse = await getToken_safari();
  }

  await saveTokenToStorage(tokenResponse);

  return tokenResponse;
}
