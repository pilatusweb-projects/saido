"use client";

import { useState } from "react";
import type { Poll } from "@/types";
import { Button } from "@/components/ui/Button";
import { hostFetch } from "@/lib/host-api";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/providers/ConfirmProvider";

interface PresenterControlsProps {
  sessionId: string;
  polls: Poll[];
  activePoll: Poll | null;
  sessionOpen: boolean;
  showJoinCode: boolean;
  onToggleJoinCode: () => void;
}

export function PresenterControls({
  sessionId,
  polls,
  activePoll,
  sessionOpen,
  showJoinCode,
  onToggleJoinCode,
}: PresenterControlsProps) {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);
  const inactivePolls = polls.filter((p) => !p.isActive);
  const [selectedId, setSelectedId] = useState<string>(
    () => inactivePolls[0]?.id ?? ""
  );

  const effectiveSelected =
    selectedId && inactivePolls.some((p) => p.id === selectedId)
      ? selectedId
      : (inactivePolls[0]?.id ?? "");

  async function handleLaunch() {
    if (!effectiveSelected) {
      toast.error("Create a poll in the control panel first.");
      return;
    }
    setLoading(true);
    try {
      const res = await hostFetch(
        `/api/session/${sessionId}/polls/${effectiveSelected}/launch`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Launch failed.");
      }
      toast.success("Poll is live.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Launch failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClose() {
    if (!activePoll) return;
    const ok = await confirm({
      title: "Close this poll?",
      description: "Participants will return to the waiting screen until you launch another poll.",
      confirmLabel: "Close poll",
      variant: "danger",
    });
    if (!ok) return;

    setLoading(true);
    try {
      const res = await hostFetch(
        `/api/session/${sessionId}/polls/${activePoll.id}/close`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Close failed.");
      }
      toast.success("Poll closed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Close failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!sessionOpen) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
      {!activePoll && inactivePolls.length > 0 && (
        <>
          <label className="sr-only" htmlFor="presenter-poll-select">
            Poll to launch
          </label>
          <select
            id="presenter-poll-select"
            value={effectiveSelected}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-xl border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm min-w-[12rem] max-w-full focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {inactivePolls.map((p) => (
              <option key={p.id} value={p.id}>
                {p.question}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={handleLaunch} disabled={loading}>
            Launch poll
          </Button>
        </>
      )}
      {!activePoll && inactivePolls.length === 0 && (
        <p className="text-sm text-slate-400">
          No polls yet — create one in the control panel
        </p>
      )}
      {activePoll && (
        <Button size="sm" variant="danger" onClick={handleClose} disabled={loading}>
          Close poll
        </Button>
      )}
      <Button
        size="sm"
        variant="secondary"
        className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700"
        onClick={onToggleJoinCode}
      >
        {showJoinCode ? "Hide join code" : "Show join code"}
      </Button>
    </div>
  );
}
