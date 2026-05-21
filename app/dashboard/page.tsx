"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/providers/AuthProvider";
import { SessionCard } from "@/components/session/SessionCard";
import { CreateSessionPanel } from "@/components/session/CreateSessionPanel";
import { Spinner } from "@/components/ui/Spinner";
import { subscribeToHostSessions } from "@/lib/firestore";
import { authFetch } from "@/lib/api-client-auth";
import { getFirestoreErrorMessage, isFirestoreUnavailable } from "@/lib/firestore-errors";
import type { Session } from "@/types";

function DashboardContent() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [usingServerList, setUsingServerList] = useState(false);
  const serverModeRef = useRef(false);

  const loadFromServer = useCallback(async () => {
    if (!user) return;
    const res = await authFetch("/api/sessions/mine");
    const data = (await res.json()) as { sessions?: Session[]; error?: string };
    if (!res.ok) {
      throw new Error(data.error ?? "Could not load sessions from server.");
    }
    setSessions(data.sessions ?? []);
    setLoading(false);
    setLoadError(null);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    serverModeRef.current = false;
    setUsingServerList(false);
    setLoadError(null);
    setLoading(true);

    const unsub = subscribeToHostSessions(
      user.uid,
      (s) => {
        if (cancelled || serverModeRef.current) return;
        setSessions(s);
        setLoading(false);
        setLoadError(null);
      },
      async (err) => {
        if (cancelled || serverModeRef.current) return;
        if (!isFirestoreUnavailable(err)) {
          setLoading(false);
          setLoadError(getFirestoreErrorMessage(err));
          return;
        }
        serverModeRef.current = true;
        setUsingServerList(true);
        try {
          await loadFromServer();
        } catch (e) {
          setLoading(false);
          setLoadError(getFirestoreErrorMessage(e));
        }
      }
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [user, loadFromServer]);

  useEffect(() => {
    if (!usingServerList || !user) return;
    const interval = setInterval(() => {
      loadFromServer().catch((e) => setLoadError(getFirestoreErrorMessage(e)));
    }, 5000);
    return () => clearInterval(interval);
  }, [usingServerList, user, loadFromServer]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold saido-heading">Your sessions</h1>
        <p className="text-slate-500 text-sm mt-1">Create and manage live polls</p>
        {usingServerList && (
          <p className="text-xs text-amber-700 mt-2 bg-amber-50 rounded-lg px-2 py-1 inline-block">
            Live sync via server (Firestore blocked on this network). List refreshes every few
            seconds.
          </p>
        )}
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
