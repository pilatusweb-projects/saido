import { getAdminAuth, isAdminConfigured } from "./firebase-admin";

export async function verifyBearerToken(
  request: Request
): Promise<{ uid: string } | { error: string; status: number }> {
  if (!isAdminConfigured()) {
    return {
      error:
        "Server is not configured. Add FIREBASE_SERVICE_ACCOUNT_KEY on Vercel (see README).",
      status: 503,
    };
  }

  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return { error: "Missing sign-in. Please log in again.", status: 401 };
  }

  const token = header.slice(7).trim();
  if (!token) {
    return { error: "Missing sign-in. Please log in again.", status: 401 };
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return { error: "Session expired. Please log in again.", status: 401 };
  }
}
