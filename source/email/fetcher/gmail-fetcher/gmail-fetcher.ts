import * as R from 'runtypes';
import {Email, EmailFetcher} from '../../types';
import * as PostalMime from 'postal-mime';
import {stringFromBase64URL} from '../../../lib/base64url';

const BASE_URL = 'https://gmail.googleapis.com';

type ListMessagesParams = [
  `users.messages.list`,
  Exclude<Parameters<gapi.client.gmail.MessagesResource['list']>[0], undefined>,
];
type GetMessageParams = [
  `users.messages.get`,
  Exclude<Parameters<gapi.client.gmail.MessagesResource['get']>[0], undefined>,
];
type FetchParams = ListMessagesParams | GetMessageParams;

type ListMessagesReturn = gapi.client.gmail.ListMessagesResponse;
type GetMessageReturn = gapi.client.gmail.Message;
type FetchReturn = ListMessagesReturn | GetMessageReturn;

export class GmailEmailFetcher implements EmailFetcher {
  constructor(private readonly accessToken: string) {}

  private static buildUrl<T extends FetchParams>(...[path, params]: T): string {
    switch (path) {
      case 'users.messages.list': {
        const {userId, ...rest} = params;
        const url = new URL(`gmail/v1/users/${userId}/messages`, BASE_URL);
        for (const [key, value] of Object.entries(rest)) {
          url.searchParams.set(key, `${value}`);
        }
        return url.toString();
      }

      case 'users.messages.get':
        const {userId, id, ...rest} = params;
        const url = new URL(
          `gmail/v1/users/${userId}/messages/${id}`,
          BASE_URL
        );
        for (const [key, value] of Object.entries(rest)) {
          url.searchParams.set(key, `${value}`);
        }
        return url.toString();
    }
  }

  private async fetch(input: ListMessagesParams): Promise<ListMessagesReturn>;
  private async fetch(input: GetMessageParams): Promise<GetMessageReturn>;
  private async fetch(input: FetchParams): Promise<FetchReturn> {
    const url = GmailEmailFetcher.buildUrl(...input);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    return response.json();
  }

  async fetchRecentEmails(): Promise<Email[]> {
    try {
      const _messageList = await this.fetch([
        'users.messages.list',
        {userId: 'me', maxResults: 5},
      ]);

      const messageList = R.Object({
        messages: R.Array(
          R.Object({
            id: R.String,
          })
        ),
      }).check(_messageList);

      if (!messageList || !messageList.messages) {
        console.log('No messages found messages for query');
        return [];
      }

      const messageDetails = await Promise.all(
        messageList.messages.map(async (message) =>
          this.fetch([
            'users.messages.get',
            {userId: 'me', id: message.id, format: 'RAW'},
          ])
        )
      );

      return Promise.all(
        messageDetails.map(async (_message) => {
          const message = R.Object({
            id: R.String,
            raw: R.String,
          }).check(_message);

          const parsed = await PostalMime.default.parse(
            stringFromBase64URL(message.raw)
          );

          return {
            id: message.id,
            subject: parsed.subject,
            from: parsed.from ? [parsed.from] : undefined,
            content: parsed.html,
          };
        })
      );
    } catch (error) {
      console.error('Failed to fetch Gmail messages:', error);
      return [];
    }
  }
}
