"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/providers/AuthProvider";
import { SessionCard } from "@/components/session/SessionCard";
import { CreateSessionPanel } from "@/components/session/CreateSessionPanel";
import { Spinner } from "@/components/ui/Spinner";
import { subscribeToHostSessions } from "@/lib/firestore";
import { getFirestoreErrorMessage } from "@/lib/firestore-errors";
import type { Session } from "@/types";

function DashboardContent() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold saido-heading">Your sessions</h1>
        <p className="text-slate-500 text-sm mt-1">Create and manage live polls</p>
      </div>

      {user && <CreateSessionPanel userId={user.uid} />}

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
        <p className="text-center text-slate-500 py-8">No sessions yet — create one above.</p>
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
