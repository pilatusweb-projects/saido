"use client";

import type { Poll } from "@/types";
import { cn } from "@/lib/utils";
import { truncateLabel } from "@/lib/truncate-label";

interface PollResultsNavProps {
  polls: Poll[];
  currentPollId: string;
  onSelect: (pollId: string) => void;
  variant?: "default" | "presenter";
}

export function PollResultsNav({
  polls,
  currentPollId,
  onSelect,
  variant = "default",
}: PollResultsNavProps) {
  if (polls.length <= 1) return null;

  const index = polls.findIndex((p) => p.id === currentPollId);
  const safeIndex = index >= 0 ? index : 0;
  const current = polls[safeIndex];
  const canPrev = safeIndex > 0;
  const canNext = safeIndex < polls.length - 1;

  const isPresenter = variant === "presenter";

  function goPrev() {
    if (canPrev) onSelect(polls[safeIndex - 1].id);
  }

  function goNext() {
    if (canNext) onSelect(polls[safeIndex + 1].id);
  }

  const btnClass = isPresenter
    ? "rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
    : "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div
      className={cn(
        "flex items-center gap-2 flex-wrap",
        isPresenter ? "mb-4" : "mt-4"
      )}
    >
      <button type="button" className={btnClass} onClick={goPrev} disabled={!canPrev}>
        Back
      </button>
      <span
        className={cn(
          "text-sm flex-1 min-w-0 text-center sm:text-left",
          isPresenter ? "text-slate-400" : "text-slate-500"
        )}
      >
        <span className={isPresenter ? "text-slate-300" : "text-slate-700"}>
          {safeIndex + 1} / {polls.length}
        </span>
        {" · "}
        <span title={current?.question}>
          {truncateLabel(current?.question ?? "", 48)}
        </span>
      </span>
      <button type="button" className={btnClass} onClick={goNext} disabled={!canNext}>
        Next
      </button>
    </div>
  );
}
