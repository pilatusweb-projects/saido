"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeToSession, subscribeToSessionPolls } from "@/lib/firestore";
import { hostFetch } from "@/lib/host-api";
import {
  hostPollToPoll,
  hostSessionToSession,
  type HostPollProps,
  type HostSessionProps,
} from "@/lib/serialize-host-data";
import type { Poll, Session } from "@/types";

interface UseHostSessionOptions {
  sessionId: string;
  initialSession: HostSessionProps;
  initialPolls: HostPollProps[];
}

export function useHostSession({
  sessionId,
  initialSession,
  initialPolls,
}: UseHostSessionOptions) {
  const [session, setSession] = useState<Session>(hostSessionToSession(initialSession));
  const [polls, setPolls] = useState<Poll[]>(initialPolls.map(hostPollToPoll));
  const [usingServerSync, setUsingServerSync] = useState(false);
  const serverSyncRef = useRef(false);

  const activePoll = polls.find((p) => p.isActive) ?? null;

  const refresh = useCallback(async () => {
    const res = await hostFetch(`/api/session/${sessionId}/host`);
    const data = (await res.json()) as {
      session?: HostSessionProps;
      polls?: HostPollProps[];
      error?: string;
    };
    if (!res.ok) throw new Error(data.error ?? "Could not load session.");
    if (data.session) {
      setSession(hostSessionToSession(data.session));
      setPolls((data.polls ?? []).map(hostPollToPoll));
    }
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    serverSyncRef.current = false;
    setUsingServerSync(false);

    const unsubSession = subscribeToSession(sessionId, (s) => {
      if (cancelled || !s) return;
      serverSyncRef.current = false;
      setUsingServerSync(false);
      setSession(s);
    });
    const unsubPolls = subscribeToSessionPolls(sessionId, (p) => {
      if (cancelled || serverSyncRef.current) return;
      setPolls(p);
    });

    return () => {
      cancelled = true;
      unsubSession();
      unsubPolls();
    };
  }, [sessionId]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!serverSyncRef.current) {
        refresh()
          .then(() => {
            serverSyncRef.current = true;
            setUsingServerSync(true);
          })
          .catch(() => {});
      }
    }, 4000);
    return () => clearTimeout(t);
  }, [refresh]);

  useEffect(() => {
    if (!usingServerSync) return;
    const interval = setInterval(() => {
      refresh().catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [usingServerSync, refresh]);

  return {
    session,
    polls,
    activePoll,
    usingServerSync,
    refresh,
  };
}
