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
import DOMPurify from 'dompurify';

type EmailAddress = {
  name?: string | undefined;
  email?: string | undefined;
};
type Email = {
  id: string;
  subject: string | undefined;
  from: EmailAddress[] | undefined;
  content: string | undefined;
};
interface EmailFetcher {
  fetchRecentEmails: () => Promise<Email[]>;
}
interface EmailParser {
  canParse: (email: Email) => boolean | Promise<boolean>;
  parse: (email: Email) => string | Promise<string>;
}

const FastmailEmailFetcher: EmailFetcher = {
  fetchRecentEmails: async () => {
    const result = await getStorage(['fastmailApiKey', 'fastmailAccountId']);

    if (!result?.fastmailApiKey || !result?.fastmailAccountId) {
      throw new Error('Fastmail API key or account ID not found');
    }

    const client = new JamClient({
      bearerToken: result?.fastmailApiKey!,
      sessionUrl: 'https://api.fastmail.com/.well-known/jmap',
    });

    await client.session;
    const accountId = result?.fastmailAccountId!;

    const unwantedMailboxes = await client.api.Mailbox.query({
      accountId,
      filter: {
        operator: 'OR',
        conditions: [{role: 'trash'}, {role: 'sent'}, {role: 'drafts'}],
      },
    });

    const recentEmails = await client.api.Email.query({
      accountId,
      filter: {
        after: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        inMailboxOtherThan: unwantedMailboxes[0].ids,
      },
    });
    const emailDetails = await client.api.Email.get({
      accountId,
      ids: recentEmails[0].ids,
      properties: ['id', 'subject', 'bodyValues', 'from'],
      fetchHTMLBodyValues: true,
    });

    return emailDetails[0].list.map((email) => {
      return {
        id: email.id,
        subject: email.subject,
        from: email.from,
        content: Object.values(email.bodyValues)[0]?.value,
      };
    });
  },
};

const Popup: FC = () => {
  const recentEmailsQuery = useQuery({
    queryFn: async () => FastmailEmailFetcher.fetchRecentEmails(),
  });

  const handleCopyClick = async (id: string): Promise<void> => {
    const email = recentEmailsQuery.data?.find((x) => x.id === id);
    if (email) {
      const parser = new DOMParser();
      const emailContent = email.content;
      if (emailContent) {
        const doc = parser.parseFromString(emailContent, 'text/html');
        const validLinks = Array.from(doc.querySelectorAll('a'))
          .filter((x) => new RegExp(/sign/gi).test(x.text))
          .map((x) => x.getAttribute('href'));
        await navigator.clipboard.writeText(
          validLinks[0] ?? 'could not find link'
        );
      }
    }
  };

  const handlePreviewClick = async (id: string): Promise<void> => {
    const email = recentEmailsQuery.data?.find((x) => x.id === id);
    if (!email) {
      return;
    }

    const mainHtmlPart = email.content;
    if (!mainHtmlPart) {
      return;
    }

    console.log(email);

    // const newWindow = window.open('', '_blank');

    // if (!newWindow) {
    //   return;

    // }

    // const policy = window.trustedTypes!.createPolicy('default', {
    //   createHTML: (to_escape) =>
    //     DOMPurify.sanitize(to_escape, {RETURN_TRUSTED_TYPE: false}),
    // });

    // if (!policy) {
    //   return;
    // }

    // newWindow.document.open();
    // newWindow.document.write(
    //   policy.createHTML(mainHtmlPart) as unknown as string
    // );
    // newWindow.document.close();
  };

  if (recentEmailsQuery.loading) {
    return <div>Loading...</div>;
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
                <button type="button" onClick={() => handleCopyClick(email.id)}>
                  Copy Link
                </button>
                <button
                  type="button"
                  onClick={() => handlePreviewClick(email.id)}
                >
                  Preview
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
