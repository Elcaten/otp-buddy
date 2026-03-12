# AGENTS.md

## Overview

OTP Buddy is a cross-browser web extension (Chrome, Firefox, Safari) built with React 19, TypeScript, and Vite 7. It fetches OTP verification codes from email (Fastmail via JMAP, Gmail via OAuth) and can auto-fill them into page inputs. Manifest V3. No backend server or database is needed.

Key libraries: SWR (data fetching hooks), motion (animations), postal-mime (email parsing), DOMPurify (HTML sanitization), runtypes (runtime validation), Sentry (error reporting and structured logging).

## Project Structure

```
source/
  background/       -- Service worker entry point (MV3)
  content-script/   -- Injected into pages, fills OTP fields
  popup/            -- Browser action popup UI (React)
  options/          -- Options/settings page UI (React)
  email-fetcher/    -- Fastmail (JMAP) + Gmail (OAuth) fetchers
    gmail-fetcher/  -- Gmail OAuth, token management, user profile
  email-parser/     -- OTP extraction from email bodies
    __test__/       -- Parser test fixtures (JSON emails + specs)
  otp-filler/       -- DOM logic to fill OTP into page inputs
  queries/          -- SWR hooks (Gmail auth)
  components/       -- Shared React components
  types/            -- TypeScript type definitions
  utils/            -- Env, logger, sentry, storage, helpers
  public/           -- Static assets (icons, CSS reset)

e2e/chromium/       -- Playwright E2E tests + fixtures
extension/chrome/   -- Build output (Chrome)
extension/firefox/  -- Build output (Firefox)
safari/             -- Safari web extension packaging
```

## Environment Variables

A `.env` file is required for builds. The build crashes without the required vars (see `source/utils/env.ts`).

| Variable | Required | Purpose |
|---|---|---|
| `VITE_OTP_BUDDY_SAFARI_CLIENT_ID` | Yes | OAuth client ID for Safari native app |
| `VITE_OTP_BUDDY_WEB_CLIENT_ID` | Yes | OAuth client ID for Chrome/Firefox |
| `VITE_OTP_BUDDY_WEB_CLIENT_SECRET` | Yes | OAuth client secret for web |
| `VITE_SENTRY_DSN` | No | Sentry DSN for error reporting + structured logging |

Copy `.env.sample` to `.env` and fill in values. Placeholder values work for unit tests and lint, but real values are needed for OAuth flows.

**Note:** `.env.sample` uses non-`VITE_`-prefixed names (e.g. `OTP_BUDDY_WEB_CLIENT_ID`), but the code requires the `VITE_` prefix. Add `VITE_` when copying.

## Key Commands

| Category | Task | Command |
|---|---|---|
| **Dev** | Dev build (Chrome, watch mode) | `npm run dev:chrome` |
| | Dev build (Firefox, watch mode) | `npm run dev:firefox` |
| **Build** | Production build (Chrome) | `npm run build:chrome` |
| | Production build (Firefox) | `npm run build:firefox` |
| | Production build (both) | `npm run build` |
| | Package Safari from Chrome build | `npm run init:safari` |
| **Lint** | Lint | `npm run lint` |
| | Lint + auto-fix | `npm run lint:fix` |
| **Test** | Unit tests (single run) | `npm run test` |
| | Unit tests (watch mode) | `npm run test:watch` |
| | Unit tests + coverage | `npm run test:coverage` |
| | E2E tests (Chromium) | `npm run test:e2e:chromium` |
| | E2E tests (Chromium, UI mode) | `npm run test:e2e:ui:chromium` |

## Testing

**Unit tests (Vitest):** Colocated as `*.spec.ts` / `*.spec.tsx` next to source files. Uses jsdom environment. `source/test-setup.ts` mocks `webextension-polyfill` and imports `@testing-library/jest-dom`. Email parser has dedicated JSON fixtures in `source/email-parser/__test__/`.

**E2E tests (Playwright):** Live in `e2e/chromium/`. Require a built extension at `extension/chrome/` — run `npm run build:chrome` first. Custom fixtures in `e2e/chromium/fixtures.ts` launch Chromium with the extension loaded via `--load-extension`.

## CI Pipeline

`.github/workflows/ci.yml` orchestrates all CI jobs:

1. **lint-and-test** — ESLint + Vitest
2. **build-chrome** / **build-firefox** — production builds (after lint-and-test passes)
3. **e2e-chromium** — Playwright E2E (after Chrome build)
4. **build-safari-unsigned** — only on version tags (`v*`)
5. **release** — only on version tags, after all builds pass

## Gotchas

- **Node version**: `.nvmrc` specifies v20.19.2; `package.json` requires `>=20`.
- **Google Chrome vs Chromium**: `--load-extension` and `--disable-extensions-except` CLI flags only work with Playwright's Chromium, not the system-installed Google Chrome.
- **E2E tests** require a built extension at `extension/chrome/`. Run `npm run build:chrome` first.
- **Playwright browsers** must be installed separately: `npx playwright install chromium`.
- **`dev:chrome` / `dev:firefox`** run in watch mode and never exit — use for iterative development, not CI.
- **`.env.sample` prefix mismatch**: The sample file omits the `VITE_` prefix. The code requires it.
- **Safari build is currently broken** — see `docs/todo.md`. The DMG downloads but the app does not function.
- **Sentry shared-environment setup**: Uses a manual `BrowserClient` + `Scope` instead of global `Sentry.init()` to avoid polluting host page state. See `source/utils/sentry.ts`.
