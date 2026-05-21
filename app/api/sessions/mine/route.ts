import { NextResponse } from "next/server";
import { verifyHostRequest } from "@/lib/api-auth";
import { listHostSessionsAdmin } from "@/lib/firestore-admin";

export async function GET(request: Request) {
  const auth = await verifyHostRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const sessions = await listHostSessionsAdmin(auth.uid);
    return NextResponse.json({ sessions });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load sessions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
