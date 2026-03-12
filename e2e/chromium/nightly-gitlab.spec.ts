import {test, expect, seedExtensionStorage, clearExtensionStorage} from './fixtures';
import {createTigrmailInbox, waitForTigrmailEmail} from './helpers/tigrmail-helper';
import {waitForGmailEmail} from './helpers/gmail-helper';
import {e2eEnv, hasGmailCredentials, hasTigrmailCredentials, hasNightlyCredentials} from './helpers/env';

/**
 * Nightly E2E test: GitLab login OTP flow.
 *
 * GitLab sign-in requires email + password. After successful password auth,
 * GitLab sends a 6-digit OTP to the account's email address.
 *
 * Requires: TIGRMAIL_TOKEN, TEST_GITLAB_EMAIL, TEST_GITLAB_PASSWORD.
 */
test.describe('Nightly: GitLab OTP flow', () => {
  test.beforeEach(async () => {
    test.skip(!hasNightlyCredentials(), 'Nightly credentials not available');
    test.skip(!hasTigrmailCredentials(), 'Tigrmail token not available');
  });

  test.afterEach(async ({serviceWorker}) => {
    await clearExtensionStorage(serviceWorker);
  });

  test('receives GitLab OTP code via Tigrmail inbox', async ({page}) => {
    test.skip(!e2eEnv.testGitlabEmail || !e2eEnv.testGitlabPassword, 'GitLab credentials not set');

    const tigrmailInbox = await createTigrmailInbox();
    expect(tigrmailInbox).toContain('@');

    await page.goto('https://gitlab.com/users/sign_in');
    await page.waitForLoadState('networkidle');

    // Fill email/username
    const loginInput = page.locator('#user_login');
    await expect(loginInput).toBeVisible({timeout: 10000});
    await loginInput.fill(e2eEnv.testGitlabEmail);

    // Fill password
    const passwordInput = page.locator('#user_password');
    await expect(passwordInput).toBeVisible({timeout: 5000});
    await passwordInput.fill(e2eEnv.testGitlabPassword);

    // Submit
    const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
    await submitButton.click();

    // Wait for the OTP email to arrive in the Tigrmail inbox
    const message = await waitForTigrmailEmail({
      inbox: tigrmailInbox,
      from: {domain: 'gitlab.com'},
    });

    expect(message).toBeTruthy();
    expect(message.subject).toBeTruthy();

    const otpMatch = message.body.match(/\b(\d{6})\b/);
    expect(otpMatch).toBeTruthy();
    expect(otpMatch![1]).toMatch(/^\d{6}$/);
  });

  test('extension parses GitLab OTP from Gmail when configured', async ({
    page,
    extensionId,
    serviceWorker,
    context,
  }) => {
    test.skip(!hasGmailCredentials(), 'Gmail credentials needed for extension testing');
    test.skip(!e2eEnv.testGitlabEmail || !e2eEnv.testGitlabPassword, 'GitLab credentials not set');

    await seedExtensionStorage(serviceWorker, {
      provider: 'gmail',
      gmailToken: JSON.stringify({
        access_token: 'expired-placeholder',
        refresh_token: e2eEnv.gmailTestRefreshToken,
        expires_in: 0,
        token_type: 'Bearer',
      }),
      gmailTokenTimestamp: 0,
    });

    await page.goto('https://gitlab.com/users/sign_in');
    await page.waitForLoadState('networkidle');

    const loginInput = page.locator('#user_login');
    await expect(loginInput).toBeVisible({timeout: 10000});
    await loginInput.fill(e2eEnv.testGitlabEmail);

    const passwordInput = page.locator('#user_password');
    await expect(passwordInput).toBeVisible({timeout: 5000});
    await passwordInput.fill(e2eEnv.testGitlabPassword);

    const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
    await submitButton.click();

    // Verify via gmail-tester that the OTP email arrived
    const emails = await waitForGmailEmail({
      from: 'gitlab.com',
      after: new Date(Date.now() - 2 * 60 * 1000),
      waitTimeSec: 15,
      maxWaitTimeSec: 120,
    });
    expect(emails.length).toBeGreaterThan(0);

    // Open extension popup — it should show the GitLab email
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const gitlabRow = popupPage.locator('tr').filter({hasText: /gitlab/i});
    await expect(gitlabRow.first()).toBeVisible({timeout: 30000});

    const copyButton = gitlabRow.first().getByRole('button', {name: /copy/i});
    await copyButton.click();
    await expect(gitlabRow.first().getByText('Copied!')).toBeVisible({timeout: 5000});
  });
});
