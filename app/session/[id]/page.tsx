import { notFound } from "next/navigation";
import { SessionHostGuard } from "@/components/auth/SessionHostGuard";
import { SessionControlClient } from "@/components/session/SessionControlClient";
import { requireHostUid } from "@/lib/auth-session-server";
import { getSessionHostAdmin } from "@/lib/firestore-admin";
import { toHostPollProps, toHostSessionProps } from "@/lib/serialize-host-data";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const uid = await requireHostUid(`/session/${id}`);
  const host = await getSessionHostAdmin(id, uid);

  if (!host) {
    notFound();
  }

  return (
    <SessionHostGuard sessionId={id}>
      <SessionControlClient
        sessionId={id}
        initialSession={toHostSessionProps(host.session)}
        initialPolls={host.polls.map(toHostPollProps)}
      />
    </SessionHostGuard>
  );
}
