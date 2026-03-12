import {test, expect} from './fixtures';
import {createTigrmailInbox, waitForTigrmailEmail} from './helpers/tigrmail-helper';
import {sendTestEmailToGmail} from './helpers/gmail-helper';
import {hasTigrmailCredentials, hasGmailCredentials} from './helpers/env';

/**
 * Tier 2: Tigrmail integration tests.
 *
 * These tests create disposable Tigrmail inboxes and verify that emails
 * sent to those addresses are received and can be parsed by the extension's
 * email parser logic.
 *
 * Sending is done via the Gmail API (same helper used in Tier 3) so that
 * the emails look realistic.  If Gmail credentials are unavailable the
 * send-dependent tests are skipped.
 */
test.describe('Tigrmail integration', () => {
  test.beforeEach(async () => {
    test.skip(!hasTigrmailCredentials(), 'Tigrmail token not available');
  });

  test('creates a disposable inbox', async () => {
    const inbox = await createTigrmailInbox();
    expect(inbox).toBeTruthy();
    expect(inbox).toContain('@');
  });

  test('receives an email sent to a disposable inbox', async () => {
    test.skip(!hasGmailCredentials(), 'Gmail credentials needed to send test email');
    test.setTimeout(120000);

    const inbox = await createTigrmailInbox();

    const otp = '482917';
    const testSubject = `E2E Tigrmail ${Date.now()} code ${otp}`;

    // Send a test email FROM the Gmail test account TO the Tigrmail inbox
    await sendTestEmailToGmail({
      subject: testSubject,
      htmlBody: `<html><body><div>${otp}</div></body></html>`,
      to: inbox,
    });

    // Poll Tigrmail for the email
    const message = await waitForTigrmailEmail({
      inbox,
      subject: {contains: `code ${otp}`},
    });

    expect(message).toBeTruthy();
    expect(message.subject).toContain(otp);
    expect(message.body).toContain(otp);
  });

  test('receives and parses a Polymarket-style OTP email', async () => {
    test.skip(!hasGmailCredentials(), 'Gmail credentials needed to send test email');
    test.setTimeout(120000);

    const inbox = await createTigrmailInbox();
    const otp = '719384';

    await sendTestEmailToGmail({
      subject: `Your Polymarket code is ${otp}`,
      htmlBody: `<html><body><p>Use this code to log in: ${otp}</p></body></html>`,
      to: inbox,
      fromName: 'Polymarket',
    });

    const message = await waitForTigrmailEmail({
      inbox,
      subject: {contains: otp},
    });

    expect(message.subject).toContain(otp);

    // Verify the 6-digit OTP is extractable via regex (same as the extension's Polymarket parser)
    const match = message.subject.match(/\d{6}/);
    expect(match?.[0]).toBe(otp);
  });

  test('receives and parses a GitLab-style OTP email', async () => {
    test.skip(!hasGmailCredentials(), 'Gmail credentials needed to send test email');
    test.setTimeout(120000);

    const inbox = await createTigrmailInbox();
    const otp = '503671';

    await sendTestEmailToGmail({
      subject: 'Confirm your GitLab account',
      htmlBody: `<html><body><p>Your confirmation code:</p><span>${otp}</span></body></html>`,
      to: inbox,
      fromName: 'GitLab',
    });

    const message = await waitForTigrmailEmail({
      inbox,
      subject: {contains: 'GitLab'},
    });

    expect(message.body).toContain(otp);

    // Verify 6-digit code is present in body (same as the extension's GitLab/fallback parser)
    const match = message.body.match(/\d{6}/);
    expect(match?.[0]).toBe(otp);
  });
});
