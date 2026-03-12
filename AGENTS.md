# AGENTS.md

## Cursor Cloud specific instructions

### Overview

OTP Buddy is a cross-browser web extension (Chrome, Firefox, Safari) built with React 19, TypeScript, and Vite. It fetches OTP verification codes from email (Fastmail via JMAP, Gmail via OAuth). No backend server or database is needed.

### Environment Variables

A `.env` file with the following `VITE_`-prefixed variables is required for builds (the build crashes without them — see `source/utils/env.ts`):

- `VITE_OTP_BUDDY_SAFARI_CLIENT_ID`
- `VITE_OTP_BUDDY_WEB_CLIENT_ID`
- `VITE_OTP_BUDDY_WEB_CLIENT_SECRET`

Copy `.env.sample` to `.env` and fill in values. Placeholder values work for unit tests and lint, but real values are needed for OAuth flows.

### Key Commands

See `package.json` scripts. Summary:

| Task | Command |
|---|---|
| Lint | `npm run lint` |
| Unit tests | `npm run test` |
| Build (Chrome, dev) | `npm run dev:chrome` |
| Build (Chrome, prod) | `npm run build:chrome` |
| E2E tests (Tier 1, no creds) | `npm run test:e2e:chromium` (requires `npm run build:chrome` first) |
| E2E tests (Tigrmail) | `npm run test:e2e:chromium:tigrmail` (needs `TIGRMAIL_TOKEN`) |
| E2E tests (Gmail) | `npm run test:e2e:chromium:gmail` (needs `GMAIL_*` env vars) |
| E2E tests (nightly) | `npm run test:e2e:chromium:nightly` (needs all provider + service creds) |
| E2E tests (all non-nightly) | `npm run test:e2e:chromium:all` |

### Gotchas

- **Google Chrome vs Chromium**: The `--load-extension` and `--disable-extensions-except` CLI flags only work with Playwright's Chromium, **not** with the system-installed Google Chrome. Use Playwright (as the E2E tests do) to load and test the extension programmatically.
- **E2E tests** require a built extension at `extension/chrome/` before running. Run `npm run build:chrome` (or `npm run dev:chrome` once) first.
- **Playwright browsers** must be installed separately: `npx playwright install chromium`.
- The `dev:chrome` script runs in watch mode and never exits — use it for iterative development but not in CI.
