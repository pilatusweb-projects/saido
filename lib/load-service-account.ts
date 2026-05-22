import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Load Firebase service account JSON for Admin SDK.
 * - FIREBASE_SERVICE_ACCOUNT_PATH: path to .json file (recommended for local dev)
 * - FIREBASE_SERVICE_ACCOUNT_KEY: single-line JSON (required on Vercel)
 */
export function loadServiceAccountJson(): { json: string | null; error: string | null } {
  const pathVar = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (pathVar) {
    try {
      const filePath = resolve(process.cwd(), pathVar);
      const raw = readFileSync(filePath, "utf8");
      JSON.parse(raw);
      return { json: raw, error: null };
    } catch {
      return {
        json: null,
        error: `Could not read FIREBASE_SERVICE_ACCOUNT_PATH (${pathVar}).`,
      };
    }
  }

  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (!inline) {
    return { json: null, error: "Service account not configured." };
  }

  if (inline.startsWith("{") && !inline.endsWith("}")) {
    return {
      json: null,
      error:
        "FIREBASE_SERVICE_ACCOUNT_KEY must be one line of JSON, or set FIREBASE_SERVICE_ACCOUNT_PATH to your key file.",
    };
  }

  try {
    JSON.parse(inline);
    return { json: inline, error: null };
  } catch {
    return { json: null, error: "FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON." };
  }
}
