"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionHostGuard } from "@/components/auth/SessionHostGuard";
import { SessionQR } from "@/components/session/SessionQR";
import { SessionNameEditor } from "@/components/session/SessionNameEditor";
import { JoinLinkPanel } from "@/components/session/JoinLinkPanel";
import { PollResultsPanel } from "@/components/session/PollResultsPanel";
import { PollForm } from "@/components/poll/PollForm";
import { PollList } from "@/components/poll/PollList";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  subscribeToSession,
  subscribeToSessionPolls,
  endSession,
  deleteSession,
} from "@/lib/firestore";
import { Badge } from "@/components/ui/Badge";
import { buildSessionCsv, downloadCsv } from "@/lib/export";
import type { Session, Poll } from "@/types";
import Link from "next/link";

function SessionControlContent({ id }: { id: string }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const lastActivePollId = useRef<string | null>(null);

  const activePoll = polls.find((p) => p.isActive) ?? null;

  useEffect(() => {
    const unsubSession = subscribeToSession(id, (s) => {
      setSession(s);
      setLoading(false);
    });
    const unsubPolls = subscribeToSessionPolls(id, setPolls);
    return () => {
      unsubSession();
      unsubPolls();
    };
  }, [id]);

  useEffect(() => {
    if (activePoll) {
      lastActivePollId.current = activePoll.id;
      setSelectedPollId(activePoll.id);
      return;
    }

    if (lastActivePollId.current) {
      setSelectedPollId(lastActivePollId.current);
      lastActivePollId.current = null;
      return;
    }

    if (polls.length === 0) {
      setSelectedPollId(null);
      return;
    }

    setSelectedPollId((current) => {
      if (current && polls.some((p) => p.id === current)) return current;
      return polls[0].id;
    });
  }, [activePoll, polls]);

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await buildSessionCsv(id);
      downloadCsv(csv, `saido-session-${session?.code ?? id}.csv`);
    } finally {
      setExporting(false);
    }
  }

  async function handleEndSession() {
    if (!session || !confirm("End this session? Participants can no longer join or vote.")) {
      return;
    }
    setEnding(true);
    try {
      await endSession(session.id);
    } finally {
      setEnding(false);
    }
  }

  async function handleDeleteSession() {
    if (!session) return;
    if (
      !confirm(
        `Delete session ${session.code} permanently? All polls and votes will be removed. This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await deleteSession(session.id);
      router.push("/dashboard");
    } catch {
      alert("Failed to delete session. Try again.");
      setDeleting(false);
    }
  }

  if (loading || !session) {
    if (!loading && !session) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-500">Session not found.</p>
          <Link href="/dashboard" className="saido-brand mt-4 inline-block">
            ← Back to dashboard
          </Link>
        </div>
      );
    }
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link href="/dashboard" className="text-sm saido-brand hover:underline">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold saido-heading mt-1">Session control</h1>
          {session && (
            <SessionNameEditor sessionId={session.id} initialName={session.name} />
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
          {session.isActive && (
            <Button variant="danger" onClick={handleEndSession} disabled={ending}>
              {ending ? "Ending…" : "End session"}
            </Button>
          )}
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            onClick={handleDeleteSession}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete session"}
          </Button>
        </div>
      </div>

      {!session.isActive && (
        <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700">
          This session has ended. Participants cannot join or vote. Use{" "}
          <strong>Poll results</strong> below or <strong>Export CSV</strong> to review votes.
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Join session</CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={session.isActive ? "active" : "inactive"}>
              {session.isActive ? "Open for joins" : "Ended"}
            </Badge>
          </div>
          <p className="text-4xl font-bold font-mono tracking-widest saido-brand mt-4">
            {session.code}
          </p>
          {session.isActive && (
            <>
              <JoinLinkPanel sessionId={session.id} code={session.code} />
              <SessionQR sessionId={session.id} code={session.code} />
            </>
          )}
          {!session.isActive && (
            <p className="text-sm text-slate-500 mt-2">Join link is disabled for this session.</p>
          )}
        </Card>

        <PollResultsPanel
          polls={polls}
          activePoll={activePoll}
          selectedPollId={selectedPollId}
          onSelectPoll={setSelectedPollId}
        />
      </div>

      {session.isActive && (
        <Card>
          <CardTitle>Create poll</CardTitle>
          <div className="mt-4">
            <PollForm sessionId={session.id} sessionCode={session.code} />
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Polls</CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          {session.isActive
            ? "Only one poll can be live at a time. Close a poll to stop voting — results stay in Poll results above."
            : "Session ended — edit or delete polls, or review results above."}
        </p>
        <div className="mt-4">
          <PollList
            polls={polls}
            sessionId={session.id}
            sessionOpen={session.isActive}
            onViewResults={setSelectedPollId}
          />
        </div>
      </Card>
    </div>
  );
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <SessionHostGuard sessionId={id}>
      <SessionControlContent id={id} />
    </SessionHostGuard>
  );
}
