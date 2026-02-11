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

import browser from 'webextension-polyfill';
import {JSX, type FC, useEffect} from 'react';
import {getAllStorage} from '../utils/storage';
import {log} from '../utils/logger';
import {CopyOTPButton} from './components/copy-opt-button';
import {OpenPreviewButton} from './components/open-preview-button';
import {useQuery} from './useQuery';
import s from './Popup.module.scss';
import {FastmailEmailFetcher} from '../email-fetcher/fastmail-fetcher';
import {getAccessToken} from '../email-fetcher/gmail-fetcher/auth';
import {GmailEmailFetcher} from '../email-fetcher/gmail-fetcher/gmail-fetcher';

function MissingSettings(): JSX.Element {
  return (
    <div style={{minWidth: 'max-content'}}>
      Please set up your email provider in the{' '}
      <button
        type="button"
        onClick={() => browser.runtime.openOptionsPage()}
        className={s.buttonLink}
      >
        extension settings
      </button>
      .
    </div>
  );
}

const Popup: FC = () => {
  const storageQuery = useQuery({
    queryKey: 'storage',
    queryFn: async () => getAllStorage(),
  });
  const isSettingsValid =
    (storageQuery.data?.provider === 'fastmail' &&
      !!storageQuery.data?.fastmailApiKey &&
      !!storageQuery.data?.fastmailAccountId) ||
    storageQuery.data?.provider === 'gmail';

  const recentFastamailMessagesQuery = useQuery({
    enabled: isSettingsValid && storageQuery.data?.provider === 'fastmail',
    queryKey: 'recentFastamailMessages',
    queryFn: async () =>
      new FastmailEmailFetcher(
        storageQuery.data?.fastmailApiKey!,
        storageQuery.data?.fastmailAccountId!
      ).fetchRecentEmails(),
  });

  const recentGmailMessagesQuery = useQuery({
    enabled: isSettingsValid && storageQuery.data?.provider === 'gmail',
    queryKey: 'recentGmailMessages',
    queryFn: async () =>
      new GmailEmailFetcher(
        (await getAccessToken({interactive: true})).access_token
      ).fetchRecentEmails(),
  });

  const isLoading =
    storageQuery.loading ||
    recentFastamailMessagesQuery.loading ||
    recentGmailMessagesQuery.loading;

  useEffect(() => {
    const err =
      storageQuery.error ??
      recentFastamailMessagesQuery.error ??
      recentGmailMessagesQuery.error;
    if (err) log.popup.error('Query failed', err);
  }, [
    storageQuery.error,
    recentFastamailMessagesQuery.error,
    recentGmailMessagesQuery.error,
  ]);

  if (!isSettingsValid) {
    return <MissingSettings />;
  }

  if (isLoading) {
    return <div style={{minWidth: 'max-content'}}>Loading...</div>;
  }

  const recentMessages =
    storageQuery.data?.provider === 'fastmail'
      ? recentFastamailMessagesQuery.data
      : recentGmailMessagesQuery.data;

  return (
    <section>
      <h1>Recent OTP</h1>

      <table
        style={{
          tableLayout: 'auto',
          minWidth: 'fit-content',
          whiteSpace: 'nowrap',
        }}
      >
        <thead>
          <tr>
            <th>Subject</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {recentMessages?.map((email) => (
            <tr key={email.id}>
              <td style={{verticalAlign: 'middle'}}>{email.subject}</td>
              <td>
                <CopyOTPButton email={email} />
                <OpenPreviewButton email={email} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default Popup;
