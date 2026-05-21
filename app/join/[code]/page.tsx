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
import type { Session, Poll } from "@/types";

export default function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const sessionCode = code.toUpperCase().trim();

  const [session, setSession] = useState<Session | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [name, setName] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [voted, setVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const chartData = usePollResults(activePoll);

  useEffect(() => {
    setSessionResolved(false);
    const unsub = subscribeToSessionByCode(sessionCode, (s) => {
      setSession(s);
      setSessionResolved(true);
    });
    return unsub;
  }, [sessionCode]);

  useEffect(() => {
    if (!session?.isActive) return;
    const unsub = subscribeToActivePoll(sessionCode, setActivePoll);
    return unsub;
  }, [session, sessionCode]);

  useEffect(() => {
    if (!activePoll) return;
    const participantId = getParticipantId(sessionCode);
    if (!participantId) return;
    hasVoted(activePoll.id, participantId).then(setVoted);
  }, [activePoll, sessionCode]);

  async function handleVote(answer: string) {
    if (!activePoll || voted) return;
    const participantId = getParticipantId(sessionCode);
    if (!participantId) return;

    setSubmitting(true);
    setError("");
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
      setError("Could not submit vote. You may have already voted.");
      const already = await hasVoted(activePoll.id, participantId);
      setVoted(already);
    } finally {
      setSubmitting(false);
    }
  }

  if (!sessionResolved) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-slate-600 font-medium">Session not found</p>
        <p className="text-sm text-slate-500 mt-2">
          Code <span className="font-mono font-bold">{sessionCode}</span> does not exist.
        </p>
        <p className="text-xs text-slate-400 mt-4">
          Scan the QR code again from the host screen, or check the 6-character code.
        </p>
      </div>
    );
  }

  if (!session.isActive) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-slate-600 font-medium">Session has ended</p>
        <p className="text-sm text-slate-500 mt-2">
          {session.name ? session.name : sessionCode} is no longer accepting participants.
        </p>
      </div>
    );
  }

  if (!nameSet) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <Card>
          <CardTitle>Join session</CardTitle>
          {session.name && (
            <p className="text-slate-700 font-medium mt-2">{session.name}</p>
          )}
          <p className="text-sm text-slate-500 mt-2 mb-4">
            Code: <span className="font-mono font-bold saido-brand">{sessionCode}</span>
          </p>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Your name (optional)
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Anonymous"
            className="mb-4"
          />
          <Button className="w-full" size="lg" onClick={() => setNameSet(true)}>
            Continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        {session.name && (
          <p className="font-medium text-slate-800">{session.name}</p>
        )}
        <p className="text-sm text-slate-500">Code {sessionCode}</p>
        {name && <p className="text-slate-700 font-medium mt-1">Hi, {name}</p>}
      </div>

      {activePoll ? (
        <Card>
          <CardTitle>{activePoll.question}</CardTitle>
          {voted ? (
            <p className="text-sm text-green-600 mt-4 bg-green-50 rounded-lg px-3 py-2">
              Thanks! Your vote has been recorded.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {activePoll.options.map((opt, index) => (
                <Button
                  key={`${activePoll.id}-option-${index}`}
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
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </Card>
      ) : (
        <Card>
          <p className="text-slate-500 text-center py-6">
            Waiting for the host to launch a poll…
          </p>
        </Card>
      )}

      <Card>
        <CardTitle>Live results</CardTitle>
        <div className="mt-4">
          {activePoll ? (
            <LiveBarChart data={chartData} />
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No active poll</p>
          )}
        </div>
      </Card>
    </div>
  );
}
