import { NextResponse } from "next/server";
import { verifyHostRequest } from "@/lib/api-auth";
import {
  updatePollAdmin,
  deletePollAdmin,
  getPollResponseCountAdmin,
} from "@/lib/firestore-admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; pollId: string }> }
) {
  const auth = await verifyHostRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id, pollId } = await context.params;
  const body = (await request.json()) as { question?: string; options?: string[] };

  if (!body.question?.trim() || !Array.isArray(body.options)) {
    return NextResponse.json({ error: "question and options required." }, { status: 400 });
  }

  try {
    await updatePollAdmin(id, auth.uid, pollId, body.question, body.options);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; pollId: string }> }
) {
  const auth = await verifyHostRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id, pollId } = await context.params;

  try {
    await deletePollAdmin(id, auth.uid, pollId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; pollId: string }> }
) {
  const auth = await verifyHostRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { pollId } = await context.params;

  try {
    const count = await getPollResponseCountAdmin(pollId);
    return NextResponse.json({ count });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lookup failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
