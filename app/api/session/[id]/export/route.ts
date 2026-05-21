import { NextResponse } from "next/server";
import { verifyHostRequest } from "@/lib/api-auth";
import {
  buildSessionCsvAdmin,
  getSessionHostAdmin,
} from "@/lib/firestore-admin";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await verifyHostRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const host = await getSessionHostAdmin(id, auth.uid);
    if (!host) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
    const csv = await buildSessionCsvAdmin(id);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="saido-session-${host.session.code}.csv"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Export failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
