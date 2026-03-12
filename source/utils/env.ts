if (
  !import.meta.env.VITE_OTP_BUDDY_SAFARI_CLIENT_ID ||
  !import.meta.env.VITE_OTP_BUDDY_WEB_CLIENT_ID ||
  !import.meta.env.VITE_OTP_BUDDY_WEB_CLIENT_SECRET
) {
  console.log(import.meta.env);
  throw new Error(
    'VITE_OTP_BUDDY_SAFARI_CLIENT_ID, VITE_OTP_BUDDY_WEB_CLIENT_ID, and VITE_OTP_BUDDY_WEB_CLIENT_SECRET must be set'
  );
}

export const env = {
  OTP_BUDDY_SAFARI_CLIENT_ID: import.meta.env.VITE_OTP_BUDDY_SAFARI_CLIENT_ID,
  OTP_BUDDY_WEB_CLIENT_ID: import.meta.env.VITE_OTP_BUDDY_WEB_CLIENT_ID,
  OTP_BUDDY_WEB_CLIENT_SECRET: import.meta.env.VITE_OTP_BUDDY_WEB_CLIENT_SECRET,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN as string | undefined,
};
