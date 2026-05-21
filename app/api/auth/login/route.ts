import { NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/firebase-admin";
import { createCustomTokenForEmailPassword } from "@/lib/auth-server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rate = checkRateLimit(request, "auth-login");
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message }, { status: 429 });
  }

  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Server auth is not configured. Add FIREBASE_SERVICE_ACCOUNT_KEY on Vercel (see README).",
        code: "server-auth-not-configured",
      },
      { status: 503 }
    );
  }

  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: "Email and password are required.", code: "invalid-argument" },
        { status: 400 }
      );
    }

    const customToken = await createCustomTokenForEmailPassword(email.trim(), password);
    return NextResponse.json({ customToken, via: "server" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Login failed.";
    const code =
      message.includes("Invalid email") || message.includes("password")
        ? "auth/invalid-credential"
        : "auth/internal-error";
    return NextResponse.json({ error: message, code }, { status: 400 });
  }
}
