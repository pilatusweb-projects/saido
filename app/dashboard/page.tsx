import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { requireHostUid } from "@/lib/auth-session-server";
import { listHostSessionsAdmin } from "@/lib/firestore-admin";
import { toHostSessionProps } from "@/lib/serialize-host-data";

export default async function DashboardPage() {
  const uid = await requireHostUid("/dashboard");
  const sessions = await listHostSessionsAdmin(uid);

  return (
    <DashboardClient
      uid={uid}
      initialSessions={sessions.map(toHostSessionProps)}
    />
  );
}
