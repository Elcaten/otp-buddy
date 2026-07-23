/// <reference types="vite/client" />

interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_OTP_BUDDY_SAFARI_CLIENT_ID: string;
  readonly VITE_OTP_BUDDY_WEB_CLIENT_ID: string;
  readonly VITE_OTP_BUDDY_WEB_CLIENT_SECRET: string;
  readonly VITE_EMAIL_PARSER_CONFIG_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
