import JamClient from 'jmap-jam';
import {Email, EmailFetcher} from '../types/email';

const afterFilterDate = new Date(Date.now() - 1000 * 60 * 60 * 100);

export class FastmailEmailFetcher implements EmailFetcher {
  private readonly client: JamClient;

  constructor(
    apiKey: string,
    private readonly accountId: string
  ) {
    this.client = new JamClient({
      bearerToken: apiKey,
      sessionUrl: 'https://api.fastmail.com/.well-known/jmap',
    });
  }

  async fetchRecentEmails(): Promise<Email[]> {
    await this.client.session;

    const unwantedMailboxes = await this.client.api.Mailbox.query({
      accountId: this.accountId,
      filter: {
        operator: 'OR',
        conditions: [{role: 'trash'}, {role: 'sent'}, {role: 'drafts'}],
      },
    });

    const recentEmails = await this.client.api.Email.query({
      accountId: this.accountId,
      filter: {
        after: afterFilterDate.toISOString(),
        inMailboxOtherThan: unwantedMailboxes[0].ids,
      },
    });
    const emailDetails = await this.client.api.Email.get({
      accountId: this.accountId,
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
  }
}
