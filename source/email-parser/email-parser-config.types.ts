/* Generated from email-parser-config.schema.json. Do not edit by hand. */

/**
 * This interface was referenced by `EmailParserConfig`'s JSON-Schema
 * via the `definition` "OtpExtractor".
 */
export type OtpExtractor = RegexOtpExtractor | XpathOtpExtractor | CssOtpExtractor;

export interface EmailParserConfig {
  /**
   * Optional schema reference used by JSON-aware editors.
   */
  $schema?: string;
  rules: EmailParserRule[];
}
/**
 * This interface was referenced by `EmailParserConfig`'s JSON-Schema
 * via the `definition` "EmailParserRule".
 */
export interface EmailParserRule {
  name?: string;
  matchers: EmailMatcher[];
  matchMode?: "all" | "any";
  /**
   * Extractors are tried in order and the first successful result wins.
   */
  extractors: OtpExtractor[];
}
/**
 * This interface was referenced by `EmailParserConfig`'s JSON-Schema
 * via the `definition` "EmailMatcher".
 */
export interface EmailMatcher {
  field: "sender.email" | "sender.name" | "subject" | "body";
  op: "contains" | "startsWith" | "endsWith" | "equals" | "matches";
  value: string;
}
/**
 * This interface was referenced by `EmailParserConfig`'s JSON-Schema
 * via the `definition` "RegexOtpExtractor".
 */
export interface RegexOtpExtractor {
  source: "subject" | "body";
  method: "regex";
  pattern: string;
  captureGroup?: number;
}
/**
 * This interface was referenced by `EmailParserConfig`'s JSON-Schema
 * via the `definition` "XpathOtpExtractor".
 */
export interface XpathOtpExtractor {
  source: "body";
  method: "xpath";
  expression: string;
}
/**
 * This interface was referenced by `EmailParserConfig`'s JSON-Schema
 * via the `definition` "CssOtpExtractor".
 */
export interface CssOtpExtractor {
  source: "body";
  method: "css";
  selector: string;
  attribute?: string;
}
