import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminConfigured } from "@/lib/firebase-admin";
import {
  SESSION_COOKIE_NAME,
  createSessionCookieFromIdToken,
  sessionCookieOptions,
  verifySessionCookieValue,
} from "@/lib/auth-session";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  const value = match
    ? decodeURIComponent(match.slice(SESSION_COOKIE_NAME.length + 1))
    : "";
  if (!value) {
    return NextResponse.json({ authenticated: false });
  }
  const verified = await verifySessionCookieValue(value);
  return NextResponse.json({ authenticated: !!verified });
}

export async function POST(request: Request) {
  const rate = checkRateLimit(request, "auth-session");
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message }, { status: 429 });
  }

  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Sign-in is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const { idToken } = (await request.json()) as { idToken?: string };
    if (!idToken?.trim()) {
      return NextResponse.json({ error: "idToken is required." }, { status: 400 });
    }

    const sessionCookie = await createSessionCookieFromIdToken(idToken.trim());
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, sessionCookieOptions());

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid token.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
