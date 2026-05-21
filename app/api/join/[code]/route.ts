import { NextResponse } from "next/server";
import { getSessionByCodeAdmin, isAdminConfigured } from "@/lib/firestore-admin";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code: raw } = await context.params;
  const code = raw.toUpperCase().trim();

  if (!code) {
    return NextResponse.json({ found: false, error: "invalid_code" }, { status: 400 });
  }

  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        found: false,
        error: "server_not_configured",
        message: "FIREBASE_SERVICE_ACCOUNT_KEY missing on server.",
      },
      { status: 503 }
    );
  }

  try {
    const session = await getSessionByCodeAdmin(code);
    if (!session) {
      return NextResponse.json({ found: false, code });
    }
    return NextResponse.json({ found: true, session });
  } catch (e) {
    return NextResponse.json(
      {
        found: false,
        error: "lookup_failed",
        message: e instanceof Error ? e.message : "Lookup failed",
      },
      { status: 500 }
    );
  }
}
