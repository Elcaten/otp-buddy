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

import JamClient from 'jmap-jam';
import type {FC} from 'react';
import {getStorage} from '../utils/storage';
import {useQuery} from './useQuery';

const Popup: FC = () => {
  const apiKey = useQuery({
    queryFn: async () => {
      const result = await getStorage(['fastmailApiKey']);
      return result.fastmailApiKey;
    },
  });

  const recentEmailsQuery = useQuery({
    enabled: !!apiKey.data,
    queryFn: async () => {
      const client = new JamClient({
        bearerToken: apiKey.data!,
        sessionUrl: 'https://api.fastmail.com/.well-known/jmap',
      });

      await client.session;
      const accountId = await client.getPrimaryAccount();

      const mailboxes = await client.api.Mailbox.query({
        accountId,
        filter: {
          operator: 'NOT',
          conditions: [{role: 'trash'}, {role: 'sent'}, {role: 'drafts'}],
        },
      });

      const recentEmails = await client.api.Email.query({
        accountId,
        filter: {
          after: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          inMailboxOtherThan: mailboxes[0].ids,
        },
      });
      const emailDetails = await client.api.Email.get({
        accountId,
        ids: recentEmails[0].ids,
        properties: ['subject', 'htmlBody', 'id', 'bodyValues'],
        fetchHTMLBodyValues: true,
      });
      return emailDetails[0].list;
    },
  });

  const handleCopyClick = async (id: string): Promise<void> => {
    const email = recentEmailsQuery.data?.find((x) => x.id === id);
    if (email) {
      const parser = new DOMParser();
      const mainHtmlPart = Object.values(email.bodyValues)[0]?.value;
      if (mainHtmlPart) {
        const doc = parser.parseFromString(mainHtmlPart, 'text/html');
        debugger;
        const validLinks = Array.from(doc.querySelectorAll('a'))
          .filter((x) => new RegExp(/sign/gi).test(x.text))
          .map((x) => x.getAttribute('href'));
        await navigator.clipboard.writeText(
          validLinks[0] ?? 'could not find link'
        );
      }
    }
  };

  if (apiKey.loading || recentEmailsQuery.loading) {
    return <div>Loading...</div>;
  }

  if (apiKey.error) {
    return <div>Error: {apiKey.error.message}</div>;
  }
  if (recentEmailsQuery.error) {
    return <div>Error: {recentEmailsQuery.error.message}</div>;
  }

  if (!apiKey.data) {
    return (
      <section style={{padding: '0.25rem', minWidth: 'max-content'}}>
        Please set your Fastmail API key in the extension settings
      </section>
    );
  }

  return (
    <section>
      <h1>Recent OTP</h1>

      <table style={{tableLayout: 'fixed', minWidth: 'max-content'}}>
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
                <button type="button" onClick={() => handleCopyClick(email.id)}>
                  Copy Link
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default Popup;
