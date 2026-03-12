import * as oauth from 'oauth4webapi';
import browser from 'webextension-polyfill';
import {isOAuthLaunchResponse, OAuthLaunchMessage} from '../../types/messages';
import {env} from '../../utils/env';
import {log} from '../../utils/logger';
import {tokenStorage} from './token-storage';
import {getBrowserType} from '../../utils/get-browser-type';

abstract class GmailOauth {
  constructor(
    private readonly client: oauth.Client,
    private readonly clientAuth: oauth.ClientAuth,
    private readonly redirectUri: string
  ) {}

  private async getAuthServerMetadata(): Promise<oauth.AuthorizationServer> {
    const ISSUER = 'https://accounts.google.com';
    const ALGORITHM = 'oauth2';
    return oauth
      .discoveryRequest(new URL(ISSUER), {algorithm: ALGORITHM})
      .then((response) => oauth.processDiscoveryResponse(new URL(ISSUER), response));
  }

  private async buildAuthURL({code_verifier}: {code_verifier: string}): Promise<string> {
    let authURL = 'https://accounts.google.com/o/oauth2/auth';

    const scopes = ['https://www.googleapis.com/auth/gmail.readonly', 'profile', 'email'];
    const code_challenge_method = 'S256';
    const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);

    authURL += `?client_id=${this.client.client_id}`;
    authURL += `&response_type=code`;
    authURL += `&redirect_uri=${encodeURIComponent(this.redirectUri)}`;
    authURL += `&scope=${encodeURIComponent(scopes.join(' '))}`;
    authURL += `&code_challenge=${code_challenge}`;
    authURL += `&code_challenge_method=${code_challenge_method}`;
    // these 2 parameters force server to return refresh_token
    authURL += `&access_type=offline`;
    authURL += `&prompt=consent`;

    return authURL;
  }

  /**
   * Ask user to authorize the app.
   */
  protected abstract promptForAuth(_: {interactive: boolean; authURL: string}): Promise<string>;

  private async requestToken({
    code_verifier,
    redirectUrlSearchParams,
  }: {
    code_verifier: string;
    redirectUrlSearchParams: URLSearchParams;
  }): Promise<oauth.TokenEndpointResponse> {
    const authServerMetadata = await this.getAuthServerMetadata();

    const params = oauth.validateAuthResponse(authServerMetadata, this.client, redirectUrlSearchParams);

    const response = await oauth.authorizationCodeGrantRequest(
      authServerMetadata,
      this.client,
      this.clientAuth,
      params,
      this.redirectUri,
      code_verifier
    );

    const result = await oauth.processAuthorizationCodeResponse(authServerMetadata, this.client, response);

    return result;
  }

  public async refreshToken({refresh_token}: {refresh_token: string}): Promise<oauth.TokenEndpointResponse> {
    try {
      const authServerMetadata = await this.getAuthServerMetadata();

      const response = await oauth.refreshTokenGrantRequest(
        authServerMetadata,
        this.client,
        this.clientAuth,
        refresh_token
      );

      const result = await oauth.processRefreshTokenResponse(authServerMetadata, this.client, response);

      log.emailFetcher.info('Refresh token succeeded');

      return result;
    } catch (error) {
      log.emailFetcher.error('Refresh token failed', {error});
      throw error;
    }
  }

  async revokeToken({token}: {token: string}): Promise<void> {
    await tokenStorage.clear();

    const authServerMetadata = await this.getAuthServerMetadata();

    const response = await oauth.revocationRequest(authServerMetadata, this.client, this.clientAuth, token);
    const result = await oauth.processRevocationResponse(response);

    log.emailFetcher.info('Token revoked', {result});

    return result;
  }

  public async getToken({interactive}: {interactive: boolean}): Promise<oauth.TokenEndpointResponse> {
    const code_verifier = oauth.generateRandomCodeVerifier();

    const authURL = await this.buildAuthURL({
      code_verifier,
    });
    log.emailFetcher.info('Requesting access');
    const redirectUrlWithParams = await this.promptForAuth({interactive, authURL});
    log.emailFetcher.info('Access granted');

    log.emailFetcher.info('Requesting token');
    const tokenResponse = await this.requestToken({
      redirectUrlSearchParams: new URL(redirectUrlWithParams).searchParams,
      code_verifier,
    });
    log.emailFetcher.info('Token granted');

    return tokenResponse;
  }
}

class ChromeFirefoxOauth extends GmailOauth {
  constructor() {
    super(
      {
        client_id: env.OTP_BUDDY_WEB_CLIENT_ID,
        client_secret: env.OTP_BUDDY_WEB_CLIENT_SECRET,
      },
      oauth.ClientSecretPost(env.OTP_BUDDY_WEB_CLIENT_SECRET),
      browser.identity.getRedirectURL()
    );
  }

  protected async promptForAuth({interactive, authURL}: {interactive: boolean; authURL: string}): Promise<string> {
    const redirectUrlWithParams = await browser.identity.launchWebAuthFlow({
      interactive: interactive,
      url: authURL,
    });

    return redirectUrlWithParams;
  }
}

class SafariOauth extends GmailOauth {
  constructor() {
    super(
      {
        client_id: env.OTP_BUDDY_SAFARI_CLIENT_ID,
      },
      oauth.None(),
      // Same as associated URL type in main app Info.plist
      'com.elcaten.otpbuddy:/'
    );
  }

  protected async promptForAuth({authURL}: {authURL: string}): Promise<string> {
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

    return redirectUrlWithParams;
  }
}

const gmailOauth = getBrowserType() === 'chrome_firefox' ? new ChromeFirefoxOauth() : new SafariOauth();

export {gmailOauth, type GmailOauth};
