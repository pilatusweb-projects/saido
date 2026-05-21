import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let _app: App | null = null;
let _initError: string | null = null;

function getAdminApp(): App | null {
  if (_app) return _app;
  if (_initError) return null;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!json) {
    _initError = "FIREBASE_SERVICE_ACCOUNT_KEY is not set.";
    return null;
  }

  let serviceAccount: Record<string, string>;
  try {
    serviceAccount = JSON.parse(json);
  } catch {
    _initError = "FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.";
    return null;
  }

  try {
    _app = getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
    return _app;
  } catch (e) {
    _initError = e instanceof Error ? e.message : "Firebase Admin init failed.";
    return null;
  }
}

/** Returns true only when Admin SDK initialized successfully. */
export function isAdminConfigured(): boolean {
  return getAdminApp() !== null;
}

/**
 * Returns the Admin Auth instance.
 * Throws only when called from server auth routes — callers must guard with isAdminConfigured().
 */
export function getAdminAuth() {
  const app = getAdminApp();
  if (!app) {
    throw new Error(_initError ?? "Firebase Admin SDK not configured.");
  }
  return getAuth(app);
}
