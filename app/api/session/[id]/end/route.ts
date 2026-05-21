import { NextResponse } from "next/server";
import { verifyHostRequest } from "@/lib/api-auth";
import { endSessionAdmin } from "@/lib/firestore-admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await verifyHostRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    await endSessionAdmin(id, auth.uid);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not end session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
