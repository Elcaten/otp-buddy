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

import {type FC} from 'react';
import {FastmailEmailFetcher} from '../email/fetcher/fastmail-fetcher';
import {getStorage} from '../utils/storage';
import {CopyOTPButton} from './components/copy-opt-button';
import {OpenPreviewButton} from './components/open-preview-button';
import {useQuery} from './useQuery';

const Popup: FC = () => {
  const storageQuery = useQuery({
    queryFn: async () => getStorage(['fastmailApiKey', 'fastmailAccountId']),
  });
  const recentEmailsQuery = useQuery({
    enabled:
      !!storageQuery.data?.fastmailApiKey &&
      !!storageQuery.data?.fastmailAccountId,
    queryFn: async () =>
      new FastmailEmailFetcher(
        storageQuery.data?.fastmailApiKey!,
        storageQuery.data?.fastmailAccountId!
      ).fetchRecentEmails(),
  });

  if (recentEmailsQuery.loading || storageQuery.loading) {
    return (
      <h1 style={{whiteSpace: 'nowrap', padding: '10px', textAlign: 'center'}}>
        Loading...
      </h1>
    );
  }

  if (storageQuery.error) {
    return <div>Error: {storageQuery.error.message}</div>;
  }
  if (recentEmailsQuery.error) {
    return <div>Error: {recentEmailsQuery.error.message}</div>;
  }

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
          {recentEmailsQuery.data?.map((email) => (
            <tr key={email.id}>
              <td>{email.subject}</td>
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
