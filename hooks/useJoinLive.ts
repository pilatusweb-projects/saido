"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { subscribeToSessionByCode, subscribeToSessionPolls } from "@/lib/firestore";
import { usePollResults } from "@/hooks/usePollResults";
import type { JoinLivePayload } from "@/lib/join-live-types";
import type { PollChartData } from "@/hooks/usePollResults";
import type { Poll } from "@/types";

const SESSION_TIMEOUT_MS = 8_000;
const LIVE_POLL_INTERVAL_MS = 3_000;

export type JoinSessionState =
  | { id: string; code: string; name: string; isActive: boolean }
  | null
  | "loading";

function joinPollToPoll(p: JoinLivePayload["activePoll"]): Poll | null {
  if (!p) return null;
  return {
    id: p.id,
    sessionId: p.sessionId,
    sessionCode: p.sessionCode,
    question: p.question,
    options: p.options,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    createdAt: Timestamp.now(),
  };
}

export function useJoinLive(sessionCode: string) {
  const normalized = sessionCode.toUpperCase().trim();
  const [session, setSession] = useState<JoinSessionState>("loading");
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [usingServerSync, setUsingServerSync] = useState(false);
  const firestoreLiveRef = useRef(false);
  const pollsLiveRef = useRef(false);

  const firestoreChart = usePollResults(usingServerSync ? null : activePoll);
  const [chartData, setChartData] = useState<PollChartData>({
    labels: [],
    values: [],
    totalVotes: 0,
  });

  useEffect(() => {
    if (usingServerSync) return;
    setChartData(firestoreChart);
  }, [usingServerSync, firestoreChart]);

  const fetchLive = useCallback(async () => {
    const res = await fetch(`/api/join/${normalized}/live`, { cache: "no-store" });
    const data = (await res.json()) as JoinLivePayload & {
      found?: boolean;
      error?: string;
    };
    if (!res.ok || !data.found || !data.session) {
      if (res.status === 404) setSession(null);
      return;
    }
    setSession({
      id: data.session.id,
      code: data.session.code,
      name: data.session.name,
      isActive: data.session.isActive,
    });
    setActivePoll(joinPollToPoll(data.activePoll));
    if (data.chart) {
      setChartData(data.chart);
    } else {
      setChartData({ labels: [], values: [], totalVotes: 0 });
    }
  }, [normalized]);

  // Session lookup (Firestore, with timeout)
  useEffect(() => {
    setSession("loading");
    setActivePoll(null);
    firestoreLiveRef.current = false;
    pollsLiveRef.current = false;
    setUsingServerSync(false);

    const timeout = setTimeout(() => {
      if (!firestoreLiveRef.current) {
        void fetchLive().then(() => setUsingServerSync(true));
      }
    }, SESSION_TIMEOUT_MS);

    const unsub = subscribeToSessionByCode(
      normalized,
      (s) => {
        clearTimeout(timeout);
        firestoreLiveRef.current = true;
        setUsingServerSync(false);
        setSession(
          s
            ? { id: s.id, code: s.code, name: s.name, isActive: s.isActive }
            : null
        );
      },
      () => {
        clearTimeout(timeout);
        void fetchLive().then(() => setUsingServerSync(true));
      }
    );

    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, [normalized, fetchLive]);

  // Active poll + options order (all polls for session, pick live one)
  useEffect(() => {
    if (!session || session === "loading" || !session.isActive) {
      setActivePoll(null);
      return;
    }

    let cancelled = false;
    pollsLiveRef.current = false;

    const pollTimeout = setTimeout(() => {
      if (!pollsLiveRef.current && !cancelled) {
        void fetchLive().then(() => {
          if (!cancelled) setUsingServerSync(true);
        });
      }
    }, SESSION_TIMEOUT_MS);

    const unsub = subscribeToSessionPolls(
      session.id,
      (polls) => {
        if (cancelled) return;
        clearTimeout(pollTimeout);
        pollsLiveRef.current = true;
        setUsingServerSync(false);
        setActivePoll(polls.find((p) => p.isActive) ?? null);
      },
      () => {
        clearTimeout(pollTimeout);
        if (!cancelled) {
          void fetchLive().then(() => setUsingServerSync(true));
        }
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(pollTimeout);
      unsub();
    };
  }, [session, fetchLive]);

  // Server polling when Firestore fallback is active
  useEffect(() => {
    if (!usingServerSync || !session || session === "loading" || !session.isActive) {
      return;
    }
    void fetchLive();
    const interval = setInterval(() => {
      void fetchLive();
    }, LIVE_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [usingServerSync, session, fetchLive]);

  // Light backup poll while on Firestore (catches missed launch/active changes)
  useEffect(() => {
    if (usingServerSync || !session || session === "loading" || !session.isActive) {
      return;
    }
    const interval = setInterval(() => {
      void fetchLive();
    }, LIVE_POLL_INTERVAL_MS * 2);
    return () => clearInterval(interval);
  }, [usingServerSync, session, fetchLive]);

  return {
    session,
    activePoll,
    chartData,
    usingServerSync,
  };
}
