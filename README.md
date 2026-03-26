# OTP Buddy

OTP Buddy is a cross-browser extension that helps you preview, copy and fill one-time passwords
(OTPs) from your recent emails. It currently supports Fastmail and Gmail

## Visual Tour

### Popup workflow + in-page autofill
[Popup workflow + in-page autofill.webm](https://github.com/user-attachments/assets/b1e42a33-4ed9-4399-a533-01754a20ce18)

Review recent emails, copy parsed OTP values, and open a sanitized email preview
in a new tab. When OTP input fields are detected on supported pages, OTP Buddy
can help fill the code from recent email messages.

## Current Functionality

- **Provider support**
  - Fastmail via JMAP API key + selected account.
  - Gmail via OAuth (`gmail.readonly`, `profile`, `email` scopes).
- **Popup workflow**
  - Shows recent email subjects.
  - `Copy` tries parser-based extraction and copies to clipboard.
  - `Fill` tries to find an inuput on a page and auto-fill OTP
  - `Preview` opens a sanitized HTML preview of the email.
- **OTP extraction model**
  - Extraction is provider-based, not generic regex for every sender.
  - Current parser coverage is explicit: GitLab, Claude, and Polymarket email
    formats.
- **Recent email fetching**
  - Gmail fetches up to 5 recent messages.
  - Fastmail fetches recent messages and excludes Trash, Sent, and Drafts.

## Setup and Usage

### 1) Download from Releases

Go to the OTP Buddy [Releases page](https://github.com/Elcaten/otp-buddy/releases/latest) and download the extension package for your
browser:

### 2) Install extension in browser

#### Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Install the downloaded extension package.

#### Firefox

1. Open `about:debugging`.
2. Click This Firefox.
3. Install the downloaded extension package.

#### Safari (macOS)

1. Open the DMG file and drag **OTPBuddy.app** into `/Applications`.
2. Remove the quarantine attribute (macOS blocks unsigned/ad-hoc downloads):
   ```bash
   xattr -cr /Applications/OTPBuddy.app
   ```
5. Open **OTPBuddy.app** and click **Quit and Open Safari Extension Settings**.
6. Enable the OTP Buddy extension in Safari settings.

### 3) Configure provider in extension options

Open OTP Buddy options from the extension menu and set up the provider.

## Browser Notes

- Manifest V3 is used for Chrome and Firefox.
- `nativeMessaging` is used for Safari OAuth handoff to the native app.
- Safari packaging helper command:

```bash
npm run init:safari
```

## Permissions Overview

- `identity`: OAuth flow for Gmail on browsers that support `browser.identity`.
- `storage`: saves provider settings and tokens.
- `nativeMessaging`: Safari OAuth bridge via native host app.
- Host access targets `http://*/*` and `https://*/*` for content-script use, with
  optional host permissions also declared for Chrome/Firefox.

## Developer Quick Reference

### Local setup

#### 1) Install dependencies

```bash
npm install
```

#### 2) Create `.env`

Builds require these variables:

- `VITE_OTP_BUDDY_SAFARI_CLIENT_ID`
- `VITE_OTP_BUDDY_WEB_CLIENT_ID`
- `VITE_OTP_BUDDY_WEB_CLIENT_SECRET`

You can copy `.env.sample` to `.env` and fill in values. Placeholder values are
usually enough for lint/tests, but real OAuth values are needed for sign-in
flows.

#### 3) Build extension assets

```bash
# Chrome
npm run build:chrome

# Firefox
npm run build:firefox

# Both
npm run build
```

#### 4) Development watch builds

```bash
npm run dev:chrome
npm run dev:firefox
```

#### 5) Load unpacked build locally

Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select `extension/chrome`.

Firefox:

1. Open `about:debugging`.
2. Click This Firefox.
3. Click Load Temporary Add-on.
4. Select `extension/firefox/manifest.json`.

### Commands

```bash
# Lint
npm run lint

# Unit tests
npm run test

# E2E (Chromium)
npm run build:chrome
npm run test:e2e:chromium
```

Notes:

- `dev:chrome` and `dev:firefox` run in watch mode and do not exit on their own.
- E2E tests require a built extension in `extension/chrome` first.

## Tech Stack

- React 19 + TypeScript 5
- Vite 7
- WebExtension API (`webextension-polyfill`)
- SCSS modules
- Vitest + Playwright
