/**
 * Popup Component
 *
 * This is the main UI that appears when the user clicks the extension icon.
 * It communicates with both the content script and background script.
 *
 * Communication Flow:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                            POPUP                                    │
 * │                                                                     │
 * │  On mount:                                                          │
 * │                                                                     │
 * │  1. Popup ──GET_PAGE_INFO──► Content Script (via browser.tabs)      │
 * │     Popup ◄──PAGE_INFO_RESPONSE── Content Script                    │
 * │     → Displays word count, link count, image count                  │
 * │                                                                     │
 * │  2. Popup ──GET_VISIT_COUNT──► Background Script (via runtime)      │
 * │     Popup ◄──VISIT_COUNT_RESPONSE── Background Script               │
 * │     → Displays total pages tracked                                  │
 * │                                                                     │
 * │  3. Popup ──► browser.storage.local                                 │
 * │     → Reads username for greeting                                   │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Note: browser.tabs.sendMessage() sends to content script in specific tab
 *       browser.runtime.sendMessage() sends to background script
 */

import {PropsWithChildren, Suspense} from 'react';
import {ErrorBoundary, FallbackProps as ErrorBoundaryFallbackProps} from 'react-error-boundary';
import useSWR from 'swr';
import browser from 'webextension-polyfill';
import {FastmailEmailFetcher} from '../email-fetcher/fastmail-fetcher';
import {GmailEmailFetcher} from '../email-fetcher/gmail-fetcher/gmail-fetcher';
import {getAllStorage} from '../utils/storage';
import s from './popup.module.scss';
import {EmailsTable} from './components/emails-table';
import {Email} from '../types/email';
import {log} from '../utils/logger';
import {tokenManager} from '../email-fetcher/gmail-fetcher/token-manager';
import {SplashScreen} from './components/splash-screen';

//#region Popup layout

const PopupLayout = Object.assign(
  function ({children}: PropsWithChildren) {
    return <section>{children}</section>;
  },
  {
    Content: function Content({children}: PropsWithChildren) {
      return <>{children}</>;
    },
  }
);
//#endregion

//#region Popup states

const PopupState = {
  Loading: () => (
    <PopupLayout>
      <PopupLayout.Content>
        <SplashScreen />
      </PopupLayout.Content>
    </PopupLayout>
  ),
  Error: (_props: ErrorBoundaryFallbackProps) => (
    <PopupLayout>
      <PopupLayout.Content>
        <p>Something went wrong</p>
      </PopupLayout.Content>
    </PopupLayout>
  ),
  MissingSettings: () => (
    <PopupLayout>
      <PopupLayout.Content>
        <p>
          Please set up your email provider in the{' '}
          <button type="button" onClick={() => browser.runtime.openOptionsPage()} className={s.buttonLink}>
            extension settings
          </button>
          .
        </p>
      </PopupLayout.Content>
    </PopupLayout>
  ),
  NoMessages: () => (
    <PopupLayout>
      <PopupLayout.Content>
        <p>No recent messages</p>
      </PopupLayout.Content>
    </PopupLayout>
  ),
  MessagesList: (props: {emails: Email[]}) => (
    <PopupLayout>
      <PopupLayout.Content>
        <EmailsTable emails={props.emails} />
      </PopupLayout.Content>
    </PopupLayout>
  ),
};
//#endregion

//#region Container components

function FastmailMessagesContainer(props: {fastmailApiKey: string; fastmailAccountId: string}) {
  const {fastmailApiKey, fastmailAccountId} = props;

  const recentFastmailMessagesQuery = useSWR(
    'recentFastmailMessages',

    async () => new FastmailEmailFetcher(fastmailApiKey, fastmailAccountId).fetchRecentEmails(),
    {suspense: true}
  );

  if (recentFastmailMessagesQuery.data.length === 0) {
    return <PopupState.NoMessages />;
  }

  return <PopupState.MessagesList emails={recentFastmailMessagesQuery.data} />;
}

function GmailMessagesContainer() {
  const recentGmailMessagesQuery = useSWR(
    'recentGmailMessages',
    async () => {
      const tokenResponse = await tokenManager.getAccessToken({interactive: true});
      log.info('popup', 'tokenResponse', tokenResponse);

      const recentEmails = await new GmailEmailFetcher(tokenResponse.access_token).fetchRecentEmails();
      log.info('popup', 'recentEmails', recentEmails);

      return recentEmails;
    },
    {suspense: true}
  );

  if (recentGmailMessagesQuery.data.length === 0) {
    return <PopupState.NoMessages />;
  }

  return <PopupState.MessagesList emails={recentGmailMessagesQuery.data} />;
}

function PopupContentContainer() {
  const storageQuery = useSWR('storage', async () => getAllStorage(), {
    suspense: true,
  });
  const isSettingsValid =
    (storageQuery.data.provider === 'fastmail' &&
      !!storageQuery.data.fastmailApiKey &&
      !!storageQuery.data.fastmailAccountId) ||
    storageQuery.data.provider === 'gmail';

  if (!isSettingsValid) {
    return <PopupState.MissingSettings />;
  }

  if (storageQuery.data.provider === 'fastmail') {
    return (
      <FastmailMessagesContainer
        fastmailApiKey={storageQuery.data.fastmailApiKey}
        fastmailAccountId={storageQuery.data.fastmailAccountId}
      />
    );
  }

  if (storageQuery.data.provider === 'gmail') {
    return <GmailMessagesContainer />;
  }

  throw new Error('Unknown provider');
}
//#endregion

//#region Popup itself

export default function Popup() {
  return (
    <ErrorBoundary FallbackComponent={PopupState.Error}>
      <Suspense fallback={<PopupState.Loading />}>
        <PopupContentContainer />
      </Suspense>
    </ErrorBoundary>
  );
}
//#endregion
