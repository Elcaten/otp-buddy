# Plan: Match Safari OAuth behavior with launchWebAuthFlow (avoid re-prompt every time)

## Problem

- **Chrome/Firefox:** `launchWebAuthFlow` opens the auth URL; if the user is already signed in and has granted access, Google often redirects immediately with the code (no login/consent UI).
- **Safari:** We use ASWebAuthenticationSession with a new session each time, so the user is asked to sign in every time.

## Approach

Persist tokens and refresh in the extension so that **all browsers** (including Safari) only run the interactive OAuth flow when necessary:

1. **First time (or after revoke):** Run OAuth → get `access_token` + `refresh_token` → store in extension storage → use `access_token`.
2. **Later:** Read stored tokens; if `access_token` is still valid (not expired), use it (no prompt). If expired and we have `refresh_token`, call Google’s token endpoint to refresh (no prompt). Only if there are no tokens or refresh fails, run the interactive OAuth flow again.

Result: Safari shows the login/consent UI only on first connect or when the user revokes access, matching the “no prompt when already granted” behavior of Chrome.

---

## 1. Request a refresh token from Google

- In the authorization URL, add **`access_type=offline`** so Google returns a `refresh_token` (and keep PKCE as-is).
- Optionally use **`prompt=consent`** only when we know we don’t have tokens yet (first run); omit it when we’re only refreshing so we don’t force consent UI. Simplest: use `access_type=offline` only; Google returns a refresh_token on first consent.

**File:** [source/email/fetcher/gmail-fetcher/auth.ts](source/email/fetcher/gmail-fetcher/auth.ts)  
- In `authorize()`, when building `authURL`, add:  
  `authURL += '&access_type=offline';`

---

## 2. Storage schema for Gmail tokens

- Extend [source/types/storage.ts](source/types/storage.ts) and default storage:
  - `gmailAccessToken: string`
  - `gmailRefreshToken: string`
  - `gmailTokenExpiry: number` (Unix timestamp when access token expires; derive from `expires_in` when we receive the token response)

- Only read/write these when provider is Gmail; clear them when user switches provider or disconnects (if you add a “disconnect” action).

---

## 3. getAccessToken() flow (token-first, then refresh, then OAuth)

**File:** [source/email/fetcher/gmail-fetcher/auth.ts](source/email/fetcher/gmail-fetcher/auth.ts)

1. **Try storage:** Load `gmailAccessToken`, `gmailTokenExpiry` (and `gmailRefreshToken`) from storage.
2. **Use access token if valid:** If we have an access token and `gmailTokenExpiry` is in the future (with a small buffer, e.g. 60 seconds), return `{ access_token: stored, ... }` (or a minimal `TokenEndpointResponse`-shaped object). No network, no prompt.
3. **Try refresh:** If we have a refresh token and (no access token or access token expired), call Google’s token endpoint with `refresh_token` via oauth4webapi:
   - `refreshTokenGrantRequest(as, client, clientAuthentication, refreshToken)`
   - `processRefreshTokenResponse(as, client, response)`
   - Use discovery (same `as` as in `validate()`). Client auth: Google accepts client_secret for confidential clients; use `oauth.ClientSecretPost(CLIENT_SECRET)` (you’ll need to add `client_secret` back to the client if it was removed).
   - On success: update storage with new `access_token`, `expires_in` → `gmailTokenExpiry`, and new `refresh_token` if present; return the new token response.
4. **Otherwise run interactive OAuth:** No valid token and no refresh (or refresh failed): run current `authorize()` + `validate()` flow. On success, persist `access_token`, `refresh_token`, and expiry; then return the token response.

Use a small helper to compute expiry timestamp from `expires_in` (e.g. `Date.now() / 1000 + expires_in`), and a constant like `TOKEN_EXPIRY_BUFFER_SECONDS = 60`.

---

## 4. Where to persist and read tokens

- **Read/write storage** in `getAccessToken()` (or in a small helper it calls). Use the existing [source/utils/storage.ts](source/utils/storage.ts) and the new storage keys so all contexts (popup, options, background) see the same tokens.
- **On OAuth success** (in `getAccessToken()` after `validate()`): write `gmailAccessToken`, `gmailRefreshToken`, and `gmailTokenExpiry`.
- **On refresh success:** same write.
- **Optional:** Add a “Disconnect Gmail” in options that clears the three Gmail token keys so the next use triggers full OAuth again.

---

## 5. Google client secret for refresh

- Google’s token endpoint typically expects the client secret when using a refresh token (confidential client). Ensure the client in auth.ts includes `client_secret` and use `oauth.ClientSecretPost(CLIENT_SECRET)` for `refreshTokenGrantRequest`’s `clientAuthentication` (same as or similar to what you use for the code exchange if you use secret there). Your current auth uses `oauth.None()` for the code exchange; if the app is registered as “confidential” in Google Cloud, use the secret for the refresh request.

---

## 6. Summary of file-level changes

| File | Change |
|------|--------|
| [source/types/storage.ts](source/types/storage.ts) | Add `gmailAccessToken`, `gmailRefreshToken`, `gmailTokenExpiry` to schema and defaults. |
| [source/email/fetcher/gmail-fetcher/auth.ts](source/email/fetcher/gmail-fetcher/auth.ts) | Add `access_type=offline` to auth URL. Implement: read storage → return if valid; else refresh if we have refresh_token; else run OAuth; persist on success (and on refresh success). Use oauth4webapi `refreshTokenGrantRequest` + `processRefreshTokenResponse`. |
| [source/utils/storage.ts](source/utils/storage.ts) | No change if new keys are optional in the schema; otherwise ensure new keys are in `StorageSchema` and defaults. |

---

## 7. Optional: Re-prompt only when needed in Safari

- No change required in the Safari native handler. By only starting the interactive OAuth flow when we have no tokens or refresh failed, Safari will automatically show the login only in those cases, matching the desired behavior.

---

## 8. Edge cases

- **User revokes access:** Next refresh will fail (e.g. 400). Clear stored tokens and surface an error; next call will run full OAuth again.
- **expires_in missing:** Some providers omit it; treat as “use for a short time” or skip “valid until” check and rely on 401 from Gmail API to trigger refresh/OAuth.
- **No refresh_token on first run:** If Google doesn’t return it (e.g. already consented before), we still run OAuth again when the access token expires until we get a refresh_token (e.g. after re-consent with `prompt=consent` once).

This plan aligns Safari with Chrome/Firefox by making the interactive flow the exception, not the default, after the first successful login.
