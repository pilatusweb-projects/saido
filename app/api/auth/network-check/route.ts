import { NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/firebase-admin";
import { checkServerCanReachIdentityToolkit } from "@/lib/auth-server";

export async function GET() {
  const adminConfigured = isAdminConfigured();
  let serverReachable = { ok: false, message: "FIREBASE_SERVICE_ACCOUNT_KEY not set." };

  if (adminConfigured) {
    serverReachable = await checkServerCanReachIdentityToolkit();
  }

  return NextResponse.json({
    adminConfigured,
    serverCanReachFirebaseAuth: serverReachable.ok,
    serverMessage: serverReachable.message,
    hint: adminConfigured
      ? "If signup still fails with CORS on the company network, your browser may block identitytoolkit.googleapis.com. Auth will try your Vercel server first, then sign in with a token."
      : "Set FIREBASE_SERVICE_ACCOUNT_KEY on Vercel to enable server-side signup/login for restricted networks.",
  });
}
