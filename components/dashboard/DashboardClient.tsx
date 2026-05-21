"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SessionCard } from "@/components/session/SessionCard";
import { CreateSessionPanel } from "@/components/session/CreateSessionPanel";
import { Spinner } from "@/components/ui/Spinner";
import { subscribeToHostSessions } from "@/lib/firestore";
import { hostFetch } from "@/lib/host-api";
import { getFirestoreErrorMessage, isFirestoreUnavailable } from "@/lib/firestore-errors";
import {
  hostSessionToSession,
  type HostSessionProps,
} from "@/lib/serialize-host-data";
import type { Session } from "@/types";

interface DashboardClientProps {
  uid: string;
  initialSessions: HostSessionProps[];
}

export function DashboardClient({ uid, initialSessions }: DashboardClientProps) {
  const [sessions, setSessions] = useState<Session[]>(
    initialSessions.map(hostSessionToSession)
  );
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [usingServerList, setUsingServerList] = useState(false);
  const serverModeRef = useRef(false);

  const loadFromServer = useCallback(async () => {
    const res = await hostFetch("/api/sessions/mine");
    const data = (await res.json()) as { sessions?: HostSessionProps[]; error?: string };
    if (!res.ok) {
      throw new Error(data.error ?? "Could not load sessions.");
    }
    setSessions((data.sessions ?? []).map(hostSessionToSession));
    setLoading(false);
    setLoadError(null);
  }, []);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    serverModeRef.current = false;
    setUsingServerList(false);

    const unsub = subscribeToHostSessions(
      uid,
      (s) => {
        if (cancelled || serverModeRef.current) return;
        setSessions(s);
        setLoading(false);
        setLoadError(null);
      },
      async (err) => {
        if (cancelled || serverModeRef.current) return;
        if (!isFirestoreUnavailable(err)) {
          setLoadError(getFirestoreErrorMessage(err));
          return;
        }
        serverModeRef.current = true;
        setUsingServerList(true);
        try {
          await loadFromServer();
        } catch (e) {
          setLoadError(getFirestoreErrorMessage(e));
        }
      }
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [uid, loadFromServer]);

  useEffect(() => {
    if (!usingServerList) return;
    const interval = setInterval(() => {
      loadFromServer().catch((e) => setLoadError(getFirestoreErrorMessage(e)));
    }, 5000);
    return () => clearInterval(interval);
  }, [usingServerList, loadFromServer]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold saido-heading">Your sessions</h1>
        <p className="text-slate-500 text-sm mt-1">Create and manage live polls</p>
        {usingServerList && (
          <p className="text-xs text-amber-700 mt-2 bg-amber-50 rounded-lg px-2 py-1 inline-block">
            Syncing via server (Firestore blocked on this network).
          </p>
        )}
      </div>

      <CreateSessionPanel />

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
