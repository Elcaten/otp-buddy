/**
 * E2E test environment variables.
 *
 * Tier 1 tests require no env vars.
 * Tier 2 requires TIGRMAIL_TOKEN.
 * Tier 3 requires GMAIL_* vars.
 * Tier 4 (nightly) requires TIGRMAIL_TOKEN + GMAIL_* vars.
 */
export const e2eEnv = {
  // Tigrmail (Tier 2 + Tier 4)
  tigrmailToken: process.env.TIGRMAIL_TOKEN ?? '',

  // Gmail / gmail-tester (Tier 3)
  gmailCredentialsJson: process.env.GMAIL_TESTER_CREDENTIALS_JSON ?? '',
  gmailTokenJson: process.env.GMAIL_TESTER_TOKEN_JSON ?? '',
  gmailTestRefreshToken: process.env.GMAIL_TEST_REFRESH_TOKEN ?? '',
  testEmailGmail: process.env.TEST_EMAIL_GMAIL ?? '',

  // Real login services (Tier 4 / nightly)
  testGitlabEmail: process.env.TEST_GITLAB_EMAIL ?? '',
  testPolymarketEmail: process.env.TEST_POLYMARKET_EMAIL ?? '',
};

export function hasTigrmailCredentials(): boolean {
  return !!e2eEnv.tigrmailToken;
}

export function hasGmailCredentials(): boolean {
  return !!(e2eEnv.gmailCredentialsJson && e2eEnv.gmailTokenJson && e2eEnv.gmailTestRefreshToken && e2eEnv.testEmailGmail);
}

export function hasNightlyCredentials(): boolean {
  return hasTigrmailCredentials() && !!(e2eEnv.testGitlabEmail || e2eEnv.testPolymarketEmail);
}
