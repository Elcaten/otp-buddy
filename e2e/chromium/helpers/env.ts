/**
 * E2E test environment variables.
 *
 * Tier 1 tests require no env vars.
 * Tier 2 requires FASTMAIL_* vars.
 * Tier 3 requires GMAIL_* vars.
 * Tier 4 (nightly) requires TEST_GITLAB_EMAIL / TEST_POLYMARKET_EMAIL.
 */
export const e2eEnv = {
  // Fastmail (Tier 2)
  fastmailApiKey: process.env.FASTMAIL_TEST_API_KEY ?? '',
  fastmailAccountId: process.env.FASTMAIL_TEST_ACCOUNT_ID ?? '',
  testEmailFastmail: process.env.TEST_EMAIL_FASTMAIL ?? '',

  // Gmail / gmail-tester (Tier 3)
  gmailCredentialsJson: process.env.GMAIL_TESTER_CREDENTIALS_JSON ?? '',
  gmailTokenJson: process.env.GMAIL_TESTER_TOKEN_JSON ?? '',
  gmailTestRefreshToken: process.env.GMAIL_TEST_REFRESH_TOKEN ?? '',
  testEmailGmail: process.env.TEST_EMAIL_GMAIL ?? '',

  // Real login services (Tier 4 / nightly)
  testGitlabEmail: process.env.TEST_GITLAB_EMAIL ?? '',
  testPolymarketEmail: process.env.TEST_POLYMARKET_EMAIL ?? '',
};

export function hasFastmailCredentials(): boolean {
  return !!(e2eEnv.fastmailApiKey && e2eEnv.fastmailAccountId && e2eEnv.testEmailFastmail);
}

export function hasGmailCredentials(): boolean {
  return !!(e2eEnv.gmailCredentialsJson && e2eEnv.gmailTokenJson && e2eEnv.gmailTestRefreshToken && e2eEnv.testEmailGmail);
}

export function hasNightlyCredentials(): boolean {
  return !!(e2eEnv.testGitlabEmail || e2eEnv.testPolymarketEmail);
}
