import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  verifySessionCookieValue,
} from "./auth-session";

/** Verify host session in Server Components / layouts. Redirects to login if invalid. */
export async function requireHostUid(nextPath?: string): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const verified = sessionCookie
    ? await verifySessionCookieValue(sessionCookie)
    : null;

  if (!verified) {
    const login = nextPath
      ? `/login?next=${encodeURIComponent(nextPath)}`
      : "/login";
    redirect(login);
  }

  return verified.uid;
}
