"use client";

import { use, useEffect, useState } from "react";
import {
  subscribeToSessionByCode,
  subscribeToActivePoll,
  submitResponse,
  hasVoted,
} from "@/lib/firestore";
import { getParticipantId } from "@/lib/participant";
import { LiveBarChart } from "@/components/charts/LiveBarChart";
import { usePollResults } from "@/hooks/usePollResults";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import type { Session, Poll } from "@/types";

type JoinSession = Pick<Session, "id" | "code" | "name" | "isActive">;

const TIMEOUT_MS = 8_000;
const joinedKey = (code: string) => `saido_joined_${code}`;
const displayNameKey = (code: string) => `saido_display_name_${code}`;

export default function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const sessionCode = code.toUpperCase().trim();

  const [session, setSession] = useState<JoinSession | null | "loading">("loading");
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [name, setName] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [voted, setVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voteError, setVoteError] = useState("");

  // Subscribe to the session document by code.
  useEffect(() => {
    setSession("loading");
    setActivePoll(null);
    setVoted(false);
    setNameSet(false);
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(displayNameKey(sessionCode));
      setName(saved ?? "");
      if (sessionStorage.getItem(joinedKey(sessionCode)) === "1") {
        setNameSet(true);
      }
    }

    // Timeout: if Firestore hasn't responded after 8s, show an error.
    const timeout = setTimeout(() => {
      setSession((current) => (current === "loading" ? null : current));
    }, TIMEOUT_MS);

    const unsub = subscribeToSessionByCode(
      sessionCode,
      (s) => {
        clearTimeout(timeout);
        setSession(
          s
            ? { id: s.id, code: s.code, name: s.name, isActive: s.isActive }
            : null
        );
      },
      () => {
        clearTimeout(timeout);
        setSession(null);
      }
    );

    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, [sessionCode]);

  // Subscribe to the active poll once we have a live session.
  useEffect(() => {
    if (!session || session === "loading" || !session.isActive) return;
    const unsub = subscribeToActivePoll(sessionCode, setActivePoll);
    return unsub;
  }, [session, sessionCode]);

  // Check whether this participant already voted on the new poll.
  useEffect(() => {
    if (!activePoll) { setVoted(false); return; }
    const participantId = getParticipantId(sessionCode);
    if (!participantId) return;
    hasVoted(activePoll.id, participantId).then(setVoted);
  }, [activePoll, sessionCode]);

  const chartData = usePollResults(activePoll);

  function handleContinue() {
    const trimmed = name.trim();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(joinedKey(sessionCode), "1");
      if (trimmed) {
        sessionStorage.setItem(displayNameKey(sessionCode), trimmed);
      } else {
        sessionStorage.removeItem(displayNameKey(sessionCode));
      }
      getParticipantId(sessionCode);
    }
    setNameSet(true);
  }

  async function handleVote(answer: string) {
    if (!activePoll || voted || submitting) return;
    const participantId = getParticipantId(sessionCode);
    if (!participantId) return;

    setSubmitting(true);
    setVoteError("");
    try {
      await submitResponse(
        activePoll.id,
        sessionCode,
        answer,
        participantId,
        name.trim() || undefined
      );
      setVoted(true);
    } catch {
      const already = await hasVoted(activePoll.id, participantId).catch(() => false);
      if (already) {
        setVoted(true);
      } else {
        setVoteError("Could not submit vote — please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // --- Loading ---
  if (session === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner />
        <p className="text-sm text-slate-500">Looking up session…</p>
      </div>
    );
  }

  // --- Not found ---
  if (!session) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-700 font-semibold text-lg">Session not found</p>
        <p className="text-sm text-slate-500">
          Code <span className="font-mono font-bold saido-brand">{sessionCode}</span> does
          not exist.
        </p>
        <p className="text-sm text-slate-400">
          Scan the QR code again from the host screen, or check the 6-character code.
        </p>
        <Link href="/">
          <Button variant="secondary" size="sm" className="mt-2">
            Try a different code
          </Button>
        </Link>
      </div>
    );
  }

  // --- Session ended ---
  if (!session.isActive) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-700 font-semibold text-lg">Session has ended</p>
        {session.name && (
          <p className="text-slate-500 text-sm">{session.name}</p>
        )}
        <p className="text-sm text-slate-400">
          This session is no longer accepting participants.
        </p>
      </div>
    );
  }

  // --- Join step: optional name (Slido-style — Continue works without a name) ---
  if (!nameSet) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <Card>
          <CardTitle>Join session</CardTitle>
          {session.name && (
            <p className="text-slate-700 font-medium mt-1">{session.name}</p>
          )}
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Code:{" "}
            <span className="font-mono font-bold saido-brand">{sessionCode}</span>
          </p>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Your name <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleContinue()}
            placeholder="Anonymous"
            className="mb-2"
            autoFocus
          />
          <p className="text-xs text-slate-400 mb-4">
            Leave blank to join anonymously. Your name is only used if the host exports
            results.
          </p>
          <Button className="w-full" size="lg" onClick={handleContinue}>
            Continue
          </Button>
        </Card>
      </div>
    );
  }

  // --- Live session view ---
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
      <div className="text-center">
        {session.name && (
          <p className="font-semibold text-slate-800">{session.name}</p>
        )}
        <p className="text-xs text-slate-400 mt-0.5">
          Code{" "}
          <span className="font-mono font-bold saido-brand">{sessionCode}</span>
          {name.trim() ? (
            <span className="text-slate-500"> · {name.trim()}</span>
          ) : (
            <span className="text-slate-500"> · Anonymous</span>
          )}
        </p>
      </div>

      {activePoll ? (
        <Card>
          <CardTitle>{activePoll.question}</CardTitle>
          {voted ? (
            <p className="mt-4 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              Vote recorded. Results update live below.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {activePoll.options.map((opt, i) => (
                <Button
                  key={`${activePoll.id}-${i}`}
                  variant="secondary"
                  className="w-full justify-start text-left"
                  size="lg"
                  onClick={() => handleVote(opt)}
                  disabled={submitting}
                >
                  {opt}
                </Button>
              ))}
            </div>
          )}
          {voteError && (
            <p className="mt-2 text-sm text-red-600">{voteError}</p>
          )}
        </Card>
      ) : (
        <Card>
          <p className="text-slate-500 text-center py-8">
            Waiting for the host to launch a poll…
          </p>
        </Card>
      )}

      {activePoll && (
        <Card>
          <CardTitle>Live results</CardTitle>
          <div className="mt-4">
            <LiveBarChart data={chartData} pollId={activePoll.id} />
          </div>
        </Card>
      )}
    </div>
  );
}
