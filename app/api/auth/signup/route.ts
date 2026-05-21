import { NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/firebase-admin";
import { createCustomTokenForNewUser } from "@/lib/auth-server";

export async function POST(request: Request) {
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

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters.", code: "weak-password" },
        { status: 400 }
      );
    }

    const customToken = await createCustomTokenForNewUser(email.trim(), password);
    return NextResponse.json({ customToken, via: "server" });
  } catch (e) {
    const err = e as { code?: string; message?: string };
    const message = err.message ?? "Signup failed.";
    const code =
      err.code === "auth/email-already-exists" || message.includes("already exists")
        ? "auth/email-already-in-use"
        : err.code === "auth/invalid-password" || message.includes("weak")
          ? "auth/weak-password"
          : "auth/internal-error";
    return NextResponse.json({ error: message, code }, { status: 400 });
  }
}
