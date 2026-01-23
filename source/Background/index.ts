// /**
//  * Background Script (Service Worker in Chrome MV3)
//  *
//  * This script runs in the background and acts as a central hub for
//  * communication between different parts of the extension.
//  *
//  * Communication Flow:
//  * ┌─────────────────────────────────────────────────────────────────────┐
//  * │                       BACKGROUND SCRIPT                             │
//  * │                                                                     │
//  * │  Content Script ──PAGE_VISITED──► Background                        │
//  * │    (page loaded)                   │                                │
//  * │                                    ▼                                │
//  * │                            Increment visitCount                     │
//  * │                            in browser.storage                       │
//  * │                                                                     │
//  * │  Popup ──GET_VISIT_COUNT──► Background                              │
//  * │                               │                                     │
//  * │                               ▼                                     │
//  * │                         Read visitCount                             │
//  * │                         from storage                                │
//  * │                               │                                     │
//  * │  Popup ◄──VISIT_COUNT_RESPONSE──┘                                   │
//  * └─────────────────────────────────────────────────────────────────────┘
//  *
//  * Message Types:
//  * - PAGE_VISITED (incoming from content): A page was visited
//  * - GET_VISIT_COUNT (incoming from popup): Request for total visit count
//  * - VISIT_COUNT_RESPONSE (outgoing to popup): Response with visit count
//  */

// import browser from 'webextension-polyfill';
// import {ExtensionMessage, VisitCountResponseMessage} from '../types/messages';
// import {getStorage, setStorage} from '../utils/storage';
// import {get} from 'node:http';
// import JamClient from 'jmap-jam';

// browser.runtime.onInstalled.addListener((): void => {
//   console.log('Extension installed');
// });

// async function init(): Promise<void> {
//   const result = await getStorage(['fastmailApiKey', 'provider']);
//   console.log('🚀 Service worker running:', result);

//   console.log('🚀 Fastmail provider found');

//   const client = new JamClient({
//     bearerToken: result.fastmailApiKey!,
//     sessionUrl: 'https://api.fastmail.com/.well-known/jmap',
//   });

//   const session = await client.session;
//   console.log('🚀 Fastmail session established');

//   const accountId = await client.getPrimaryAccount();
//   console.log('🚀 Fastmail account ID:', accountId);

//   const mailboxes = await client.api.Mailbox.query({
//     accountId,
//     filter: {
//       operator: 'NOT',
//       conditions: [{role: 'trash'}, {role: 'sent'}, {role: 'drafts'}],
//     },
//   });
//   console.log('🚀 Fastmail mailboxes:', mailboxes);

//   const recentEmails = await client.api.Email.query({
//     accountId,
//     filter: {
//       after: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
//       inMailboxOtherThan: mailboxes[0].ids,
//     },
//   });

//   console.log('🚀 Fastmail recent emails:', recentEmails);

//   const emailDetails = await client.api.Email.get({
//     accountId,
//     ids: recentEmails[0].ids,
//     properties: ['subject', 'htmlBody', 'id', 'bodyValues'],
//     fetchHTMLBodyValues: true,
//   });
//   console.log('🚀 Fastmail email details:', emailDetails);

//   let since = recentEmails[0].queryState;

//   setInterval(async () => {
//     const changes = await client.api.Email.queryChanges({
//       accountId,
//       sinceQueryState: since,
//     });
//     since = changes[0].newQueryState;
//     console.log('🚀 Fastmail changes:', changes);
//   }, 10_000);
// }

// // init().catch((e) => console.error(e));

// // // Listen for messages from popup or content scripts
// // browser.runtime.onMessage.addListener(
// //   (message: unknown): Promise<VisitCountResponseMessage> | undefined => {
// //     const msg = message as ExtensionMessage;

// //     // Content script notifies us when a page is visited
// //     if (msg.type === 'PAGE_VISITED') {
// //       console.log('Page visited:', msg.data.title, '-', msg.data.url);
// //       console.log(
// //         `  Words: ${msg.data.wordCount}, Links: ${msg.data.linkCount}, Images: ${msg.data.imageCount}`
// //       );

// //       // Increment visit count
// //       getStorage(['visitCount']).then(({visitCount}) => {
// //         setStorage({visitCount: visitCount + 1});
// //       });

// //       return undefined;
// //     }

// //     // Popup requests the visit count
// //     if (msg.type === 'GET_VISIT_COUNT') {
// //       return getStorage(['visitCount']).then(({visitCount}) => {
// //         return {
// //           type: 'VISIT_COUNT_RESPONSE',
// //           count: visitCount,
// //         };
// //       });
// //     }

// //     return undefined;
// //   }
// // );
