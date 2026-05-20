"use client";

import type { Poll } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PollEditForm } from "@/components/poll/PollEditForm";
import { launchPoll, closePoll, deletePoll } from "@/lib/firestore";
import { useState } from "react";

interface PollListProps {
  polls: Poll[];
  sessionId: string;
  /** When false (ended session), hide Launch/Close but allow edit/delete */
  sessionOpen?: boolean;
  onViewResults?: (pollId: string) => void;
}

export function PollList({
  polls,
  sessionId,
  sessionOpen = true,
  onViewResults,
}: PollListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleLaunch(pollId: string) {
    setLoadingId(pollId);
    try {
      await launchPoll(sessionId, pollId);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleClose(pollId: string) {
    setLoadingId(pollId);
    try {
      await closePoll(pollId);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(poll: Poll) {
    if (
      !confirm(
        `Delete "${poll.question}"? All votes for this poll will be permanently removed.`
      )
    ) {
      return;
    }
    setLoadingId(poll.id);
    try {
      await deletePoll(poll.id);
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete poll.");
    } finally {
      setLoadingId(null);
    }
  }

  if (polls.length === 0) {
    return <p className="text-sm text-slate-500">No polls yet. Create one above.</p>;
  }

  return (
    <ul className="space-y-3">
      {polls.map((poll) => (
        <li
          key={poll.id}
          className="p-4 rounded-xl border border-slate-100 bg-slate-50/50"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-slate-900">{poll.question}</p>
                {poll.isActive && <Badge variant="live">Live</Badge>}
              </div>
              <p className="text-xs text-slate-500 mt-1">{poll.options.join(" · ")}</p>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              {sessionOpen &&
                (!poll.isActive ? (
                  <Button
                    size="sm"
                    onClick={() => handleLaunch(poll.id)}
                    disabled={loadingId === poll.id}
                  >
                    Launch
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleClose(poll.id)}
                    disabled={loadingId === poll.id}
                  >
                    Close
                  </Button>
                ))}
              {!poll.isActive && (
                <>
                  {onViewResults && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onViewResults(poll.id)}
                      disabled={loadingId === poll.id}
                    >
                      Results
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setEditingId(editingId === poll.id ? null : poll.id)
                    }
                    disabled={loadingId === poll.id}
                  >
                    {editingId === poll.id ? "Cancel edit" : "Edit"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(poll)}
                    disabled={loadingId === poll.id}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
          {editingId === poll.id && !poll.isActive && (
            <PollEditForm
              poll={poll}
              onSaved={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
