import { NextResponse } from "next/server";
import { getSessionJoinInfoByIdAdmin, isAdminConfigured } from "@/lib/firestore-admin";
import { getAppUrl } from "@/lib/firebase";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 503 });
  }

  try {
    const session = await getSessionJoinInfoByIdAdmin(id);
    if (!session) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    const base = getAppUrl().replace(/\/$/, "");
    const joinPath = `/join/${session.code}`;
    return NextResponse.json({
      found: true,
      code: session.code,
      name: session.name,
      isActive: session.isActive,
      joinPath,
      joinUrl: `${base}${joinPath}`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
