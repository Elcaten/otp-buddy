/**
 * Native messaging types (extension <-> Safari native app).
 * Keeps TS and Swift in sync for sendNativeMessage / beginRequest(with:).
 */

export interface NativeOAuthRequest {
  type: 'oauth';
  authURL: string;
}

export interface NativeOAuthSuccessResponse {
  redirectURL: string;
}

export interface NativeOAuthErrorResponse {
  error: string;
}

export type NativeOAuthResponse =
  | NativeOAuthSuccessResponse
  | NativeOAuthErrorResponse;
