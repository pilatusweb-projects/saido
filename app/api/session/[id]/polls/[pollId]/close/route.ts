import { NextResponse } from "next/server";
import { verifyHostRequest } from "@/lib/api-auth";
import { closePollAdmin } from "@/lib/firestore-admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; pollId: string }> }
) {
  const auth = await verifyHostRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id, pollId } = await context.params;

  try {
    await closePollAdmin(id, auth.uid, pollId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not close poll.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
