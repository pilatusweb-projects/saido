"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/providers/AuthProvider";
import { SessionCard } from "@/components/session/SessionCard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { createSession, subscribeToHostSessions, isCodeUnique } from "@/lib/firestore";
import { getFirestoreErrorMessage } from "@/lib/firestore-errors";
import { generateJoinCode } from "@/lib/codes";
import type { Session } from "@/types";

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoadError(null);
    const unsub = subscribeToHostSessions(
      user.uid,
      (s) => {
        setSessions(s);
        setLoading(false);
        setLoadError(null);
      },
      (err) => {
        setLoading(false);
        setLoadError(getFirestoreErrorMessage(err));
      }
    );
    return unsub;
  }, [user]);

  async function handleCreateSession() {
    if (!user) return;
    setCreating(true);
    try {
      let code = generateJoinCode();
      let attempts = 0;
      while (!(await isCodeUnique(code)) && attempts < 10) {
        code = generateJoinCode();
        attempts++;
      }
      const id = await createSession(code, user.uid);
      router.push(`/session/${id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold saido-heading">Your sessions</h1>
          <p className="text-slate-500 text-sm mt-1">Create and manage live polls</p>
        </div>
        <Button onClick={handleCreateSession} disabled={creating}>
          {creating ? "Creating…" : "+ New session"}
        </Button>
      </div>

      {loadError && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : sessions.length === 0 && !loadError ? (
        <div className="text-center py-16 text-slate-500">
          <p>No sessions yet.</p>
          <Button className="mt-4" onClick={handleCreateSession} disabled={creating}>
            Create your first session
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
