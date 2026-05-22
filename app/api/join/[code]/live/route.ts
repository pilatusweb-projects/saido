import { NextResponse } from "next/server";
import { getJoinLiveAdmin, isAdminConfigured } from "@/lib/firestore-admin";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const rate = checkRateLimit(request, "join-live");
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message }, { status: 429 });
  }

  const { code: raw } = await context.params;
  const code = raw.toUpperCase().trim();

  if (!code) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 503 });
  }

  try {
    const live = await getJoinLiveAdmin(code);
    if (!live) {
      return NextResponse.json({ found: false, code }, { status: 404 });
    }
    return NextResponse.json({ found: true, ...live });
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
