"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionQR } from "@/components/session/SessionQR";
import { SessionNameEditor } from "@/components/session/SessionNameEditor";
import { JoinLinkPanel } from "@/components/session/JoinLinkPanel";
import { PollResultsPanel } from "@/components/session/PollResultsPanel";
import { PollForm } from "@/components/poll/PollForm";
import { PollList } from "@/components/poll/PollList";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { hostFetch } from "@/lib/host-api";
import { useHostSession } from "@/hooks/useHostSession";
import type { HostPollProps, HostSessionProps } from "@/lib/serialize-host-data";
import { Badge } from "@/components/ui/Badge";
import { downloadCsv } from "@/lib/export";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import Link from "next/link";

interface SessionControlClientProps {
  sessionId: string;
  initialSession: HostSessionProps;
  initialPolls: HostPollProps[];
}

export function SessionControlClient({
  sessionId,
  initialSession,
  initialPolls,
}: SessionControlClientProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const { session, polls, activePoll, usingServerSync, refresh } = useHostSession({
    sessionId,
    initialSession,
    initialPolls,
  });
  const [exporting, setExporting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const lastActivePollId = useRef<string | null>(null);

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
      const res = await hostFetch(`/api/session/${sessionId}/export`);
      if (!res.ok) throw new Error("Export failed.");
      const csv = await res.text();
      downloadCsv(csv, `saido-session-${session.code}.csv`);
      toast.success("CSV exported.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  async function handleEndSession() {
    const ok = await confirm({
      title: "End session?",
      description: "Participants can no longer join or vote.",
      confirmLabel: "End session",
      variant: "danger",
    });
    if (!ok) return;

    setEnding(true);
    try {
      const res = await hostFetch(`/api/session/${sessionId}/end`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Could not end session.");
      }
      await refresh();
      toast.success("Session ended.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to end session.");
    } finally {
      setEnding(false);
    }
  }

  async function handleDeleteSession() {
    const ok = await confirm({
      title: `Delete session ${session.code}?`,
      description:
        "All polls and votes will be permanently removed. This cannot be undone.",
      confirmLabel: "Delete session",
      variant: "danger",
    });
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await hostFetch(`/api/session/${sessionId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Delete failed.");
      }
      toast.success("Session deleted.");
      router.push("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete session.");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link href="/dashboard" className="text-sm saido-brand hover:underline">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold saido-heading mt-1">Session control</h1>
          {usingServerSync && (
            <p className="text-xs text-amber-700 mt-1 bg-amber-50 rounded px-2 py-0.5 inline-block">
              Syncing via server (Firestore unavailable on this network)
            </p>
          )}
          <SessionNameEditor sessionId={session.id} initialName={session.name} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href={`/session/${sessionId}/present`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl font-medium transition-all px-3 py-1.5 text-sm bg-primary text-white hover:bg-primary-hover shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Presenter mode
          </a>
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
          This session has ended. Participants cannot join or vote.
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
            ? "Only one poll can be live at a time."
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
