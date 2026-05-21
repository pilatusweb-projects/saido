import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!json) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Required for server-side auth on restricted networks."
    );
  }

  let serviceAccount: Record<string, string>;
  try {
    serviceAccount = JSON.parse(json);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON.");
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
}
