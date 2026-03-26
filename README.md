# OTP Buddy

OTP Buddy is a cross-browser extension that helps you fetch one-time passwords
(OTPs) from recent emails and copy them quickly.

It currently supports Fastmail and Gmail as providers, with a popup workflow
focused on speed: review recent messages, copy parsed OTPs, or preview sanitized
email HTML.

## Visual Tour

### Popup workflow + in-page autofill

<video src="output.webm"  muted playsinline autoplay style="max-width: 100%;"></video>

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
  - `Preview` opens a sanitized HTML preview of the email.
- **OTP extraction model**
  - Extraction is parser-based, not generic regex for every sender.
  - Current parser coverage is explicit: GitLab, Claude, and Polymarket email
    formats.
- **Recent email fetching**
  - Gmail fetches up to 5 recent messages.
  - Fastmail fetches recent messages and excludes Trash, Sent, and Drafts.

## Setup and Usage

### 1) Download from Releases

Go to the OTP Buddy Releases page and download the extension package for your
browser:

https://github.com/Elcaten/otp-buddy/releases

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

The Safari release is an ad-hoc signed `.dmg`. After downloading:

1. Open the DMG and drag **OTPBuddy.app** into `/Applications`.
2. Remove the quarantine attribute (macOS blocks unsigned/ad-hoc downloads):
   ```bash
   xattr -cr /Applications/OTPBuddy.app
   ```
3. Enable the Safari Developer menu if you haven't already:
   Safari > Settings > Advanced > check **Show features for web developers**.
4. Enable unsigned extensions:
   Safari > Develop > check **Allow Unsigned Extensions** (required each Safari
   launch).
5. Open **OTPBuddy.app** and click **Quit and Open Safari Extension Settings**.
6. Enable the OTP Buddy extension in Safari settings.

### 3) Configure provider in extension options

Open OTP Buddy options from the extension menu and choose one provider.

#### Fastmail

- Enter a Fastmail API key.
- Select a Fastmail account from the discovered account list.
- Save settings.

#### Gmail

- Choose Gmail provider.
- Sign in with Google in the options page.
- Save settings if prompted.

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
