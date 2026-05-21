import { getAdminAuth, isAdminConfigured } from "./firebase-admin";

export const SESSION_COOKIE_NAME = "__saido_session";

/** 14 days in milliseconds */
export const SESSION_COOKIE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function sessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_MS / 1000,
  };
}

export async function createSessionCookieFromIdToken(
  idToken: string
): Promise<string> {
  if (!isAdminConfigured()) {
    throw new Error("Firebase Admin SDK is not configured.");
  }
  return getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_COOKIE_MAX_AGE_MS,
  });
}

export async function verifySessionCookieValue(
  sessionCookie: string
): Promise<{ uid: string } | null> {
  if (!isAdminConfigured() || !sessionCookie) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

export function getSessionCookieFromRequest(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const match = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(SESSION_COOKIE_NAME.length + 1));
}
