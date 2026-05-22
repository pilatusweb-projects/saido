import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { loadServiceAccountJson } from "./load-service-account";

let _app: App | null = null;
let _initError: string | null = null;

export function getAdminApp(): App | null {
  if (_app) return _app;
  if (_initError) return null;

  const { json, error } = loadServiceAccountJson();
  if (!json) {
    _initError = error ?? "Service account not configured.";
    return null;
  }

  let serviceAccount: Record<string, string>;
  try {
    serviceAccount = JSON.parse(json);
  } catch {
    _initError = "Service account JSON is invalid.";
    return null;
  }

  try {
    _app =
      getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
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

export function getAdminAuth() {
  const app = getAdminApp();
  if (!app) {
    throw new Error(_initError ?? "Firebase Admin SDK not configured.");
  }
  return getAuth(app);
}
