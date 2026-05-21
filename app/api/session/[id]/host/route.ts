import { NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/api-auth";
import { getSessionHostAdmin } from "@/lib/firestore-admin";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await verifyBearerToken(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const data = await getSessionHostAdmin(id, auth.uid);
    if (!data) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
