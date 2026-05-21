/** Edge-safe constants — no firebase-admin imports (used by middleware). */

export const SESSION_COOKIE_NAME = "__saido_session";

/** 14 days in milliseconds */
export const SESSION_COOKIE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
