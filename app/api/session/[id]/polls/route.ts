import { NextResponse } from "next/server";
import { verifyHostRequest } from "@/lib/api-auth";
import { createPollAdmin } from "@/lib/firestore-admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await verifyHostRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { question?: string; options?: string[] };

  if (!body.question?.trim()) {
    return NextResponse.json({ error: "question is required." }, { status: 400 });
  }
  if (!Array.isArray(body.options)) {
    return NextResponse.json({ error: "options array is required." }, { status: 400 });
  }

  try {
    const pollId = await createPollAdmin(
      id,
      auth.uid,
      body.question,
      body.options
    );
    return NextResponse.json({ pollId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create poll.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
