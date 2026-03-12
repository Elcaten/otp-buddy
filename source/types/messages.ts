/**
 * Extension Message Types
 *
 * This file defines all message types used for communication between
 * the different parts of the extension.
 *
 */

import * as R from 'runtypes';

/** Popup/Options -> Background: start OAuth flow (Safari path; background calls native). */
export interface OAuthLaunchMessage {
  type: 'OAUTH_LAUNCH';
  authURL: string;
}

export function isOAuthLaunchMessage(message: unknown): message is OAuthLaunchMessage {
  return R.Object({
    type: R.Literal('OAUTH_LAUNCH'),
    authURL: R.String,
  }).guard(message);
}

/** Background -> Popup: OAuth result (redirect URL for identity layer, or tokens when background does exchange). */
export interface OAuthLaunchResponse {
  redirectURL?: string;
  error?: string;
}

export function isOAuthLaunchResponse(message: unknown): message is OAuthLaunchResponse {
  return R.Object({
    redirectURL: R.String.optional(),
    error: R.String.optional(),
  }).guard(message);
}

/** Popup -> Content script: fill the current page OTP input(s). */
export interface FillOtpMessage {
  type: 'FILL_OTP';
  code: string;
}

export function isFillOtpMessage(message: unknown): message is FillOtpMessage {
  return R.Object({
    type: R.Literal('FILL_OTP'),
    code: R.String,
  }).guard(message);
}

/** Content script -> Popup: result of attempting to fill OTP inputs. */
export interface FillOtpResponse {
  success: boolean;
  error?: string;
}

export function isFillOtpResponse(message: unknown): message is FillOtpResponse {
  return R.Object({
    success: R.Boolean,
    error: R.String.optional(),
  }).guard(message);
}

/** Any context -> Background: log entry for centralized logging. */
export interface LogMessage {
  type: 'log';
  level: 'debug' | 'info' | 'warn' | 'error';
  source: 'background' | 'popup' | 'content' | 'options' | 'email-fetcher' | 'email-parser';
  message: string;
  data?: unknown;
  timestamp?: number;
}

export function isLogMessage(message: unknown): message is LogMessage {
  return R.Object({
    type: R.Literal('log'),
    level: R.Union(R.Literal('debug'), R.Literal('info'), R.Literal('warn'), R.Literal('error')),
    source: R.String,
    message: R.String,
    data: R.Unknown.optional(),
    timestamp: R.Number.optional(),
  }).guard(message);
}

export type ExtensionMessage =
  | OAuthLaunchMessage
  | OAuthLaunchResponse
  | FillOtpMessage
  | FillOtpResponse
  | LogMessage;
