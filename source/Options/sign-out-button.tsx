import {JSX} from 'react';
import {signOut_chrome_firefox} from '../email-fetcher/gmail-fetcher/auth';

export const SignOutButton = (): JSX.Element => (
  <button type="button" onClick={signOut_chrome_firefox}>
    Sign Out
  </button>
);
