# OTP Buddy

OTP Buddy is a cross-browser extension that helps you fill one-time passwords
(OTPs) from your recent emails. It currently supports Fastmail and Gmail.

## Visual Tour

[Popup workflow + in-page autofill.webm](https://github.com/user-attachments/assets/b1e42a33-4ed9-4399-a533-01754a20ce18)

Check your latest emails right from the popup. You can auto-fill detected OTPs with one click, or copy and paste them if auto-fill fails. If an OTP isn't detected, open the email in a new tab to find it manually.

## Setup and Usage

### 1) Download from Releases

Go to [releases page](https://github.com/Elcaten/otp-buddy/releases/latest) and download the extension package for your
browser.

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
3. Open **OTPBuddy.app** and click **Quit and Open Safari Extension Settings**.
4. Enable the OTP Buddy extension in Safari settings.

### 3) Configure provider in extension options

Open OTP Buddy options from the extension menu and set up the provider.

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

- `VITE_OTP_BUDDY_SAFARI_CLIENT_ID` - GCP oauth client client_id for safari (redirects to desktop app)
- `VITE_OTP_BUDDY_WEB_CLIENT_ID` - GCP oauth client client_id (redirects to extension)
- `VITE_OTP_BUDDY_WEB_CLIENT_SECRET` - GCP oauth client client_secret (redirects to extension)
- `VITE_SENTRY_DSN` - Sentry configuration (optional)

#### 4) Launch dev server

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
