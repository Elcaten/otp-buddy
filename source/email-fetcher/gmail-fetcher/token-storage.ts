import {log} from '../../utils/logger';
import {clearStorage, getStorage, setStorage} from '../../utils/storage';
import * as oauth from 'oauth4webapi';

export type StoredToken =
  | {type: 'not_found'}
  | {type: 'valid'; token: oauth.TokenEndpointResponse}
  | {type: 'expired'; token: oauth.TokenEndpointResponse};

export const tokenStorage = {
  get: getStoredToken,
  set: setStoredToken,
  clear: clearStoredToken,
};

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

async function setStoredToken(token: oauth.TokenEndpointResponse): Promise<void> {
  log.emailFetcher.info('Saving token to storage', {timestamp: Date.now()});
  await setStorage({gmailToken: JSON.stringify(token), gmailTokenTimestamp: Date.now()});
}

async function clearStoredToken(): Promise<void> {
  await clearStorage(['gmailToken', 'gmailTokenTimestamp']);
}
