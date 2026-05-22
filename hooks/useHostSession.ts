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

/** Wait for Firestore before assuming the client cannot reach it */
const FIRESTORE_LIVE_TIMEOUT_MS = 12_000;
const SERVER_POLL_INTERVAL_MS = 5_000;

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

  const sessionLiveRef = useRef(false);
  const pollsLiveRef = useRef(false);
  const pollingActiveRef = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activePoll = polls.find((p) => p.isActive) ?? null;

  const stopPolling = useCallback(() => {
    pollingActiveRef.current = false;
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setUsingServerSync(false);
  }, []);

  const isFirestoreLive = useCallback(
    () => sessionLiveRef.current && pollsLiveRef.current,
    []
  );

  const tryMarkLive = useCallback(() => {
    if (isFirestoreLive()) {
      stopPolling();
    }
  }, [isFirestoreLive, stopPolling]);

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

  const startPolling = useCallback(() => {
    if (pollingActiveRef.current || isFirestoreLive()) return;
    pollingActiveRef.current = true;
    setUsingServerSync(true);
    refresh().catch(() => {});
    pollIntervalRef.current = setInterval(() => {
      refresh().catch(() => {});
    }, SERVER_POLL_INTERVAL_MS);
  }, [refresh, isFirestoreLive]);

  useEffect(() => {
    let cancelled = false;
    sessionLiveRef.current = false;
    pollsLiveRef.current = false;
    stopPolling();

    const onSessionError = () => {
      if (!cancelled && !isFirestoreLive()) startPolling();
    };
    const onPollsError = () => {
      if (!cancelled && !isFirestoreLive()) startPolling();
    };

    const unsubSession = subscribeToSession(
      sessionId,
      (s) => {
        if (cancelled) return;
        sessionLiveRef.current = true;
        if (s) setSession(s);
        tryMarkLive();
      },
      onSessionError
    );

    const unsubPolls = subscribeToSessionPolls(
      sessionId,
      (p) => {
        if (cancelled) return;
        pollsLiveRef.current = true;
        setPolls(p);
        tryMarkLive();
      },
      onPollsError
    );

    const timeout = setTimeout(() => {
      if (!cancelled && !isFirestoreLive()) {
        startPolling();
      }
    }, FIRESTORE_LIVE_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsubSession();
      unsubPolls();
      stopPolling();
    };
  }, [sessionId, startPolling, stopPolling, tryMarkLive, isFirestoreLive]);

  return {
    session,
    polls,
    activePoll,
    usingServerSync,
    refresh,
  };
}
