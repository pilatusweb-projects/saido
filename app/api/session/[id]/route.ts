import { NextResponse } from "next/server";
import { verifyHostRequest } from "@/lib/api-auth";
import {
  updateSessionNameAdmin,
  deleteSessionAdmin,
} from "@/lib/firestore-admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await verifyHostRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { name?: string };
  if (typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  try {
    await updateSessionNameAdmin(id, auth.uid, body.name);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed.";
    const status = message === "Forbidden." ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await verifyHostRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    await deleteSessionAdmin(id, auth.uid);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed.";
    const status = message === "Forbidden." ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
