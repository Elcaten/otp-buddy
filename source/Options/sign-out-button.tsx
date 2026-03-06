import {JSX} from 'react';
import {tokenManager} from '../email-fetcher/gmail-fetcher/token-manager';

export const SignOutButton = (): JSX.Element => (
  <button type="button" onClick={tokenManager.revokeAccessToken}>
    Sign Out
  </button>
);
