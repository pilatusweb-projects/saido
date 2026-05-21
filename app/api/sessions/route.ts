import { NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/api-auth";
import { createSessionAdmin } from "@/lib/firestore-admin";

export async function POST(request: Request) {
  const auth = await verifyBearerToken(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let name = "";
  try {
    const body = (await request.json()) as { name?: string };
    name = typeof body.name === "string" ? body.name : "";
  } catch {
    /* empty body is fine */
  }

  try {
    const session = await createSessionAdmin(auth.uid, name);
    return NextResponse.json(session);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
