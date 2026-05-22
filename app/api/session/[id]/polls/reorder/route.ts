import { NextResponse } from "next/server";
import { verifyHostRequest } from "@/lib/api-auth";
import { reorderPollsAdmin } from "@/lib/firestore-admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await verifyHostRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { pollIds?: string[] };

  if (!Array.isArray(body.pollIds) || body.pollIds.length === 0) {
    return NextResponse.json({ error: "pollIds array is required." }, { status: 400 });
  }

  try {
    await reorderPollsAdmin(id, auth.uid, body.pollIds);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not reorder polls.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
