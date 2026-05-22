"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Poll } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PollEditForm } from "@/components/poll/PollEditForm";
import { hostFetch } from "@/lib/host-api";
import { sortPolls } from "@/lib/sort-polls";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { cn } from "@/lib/utils";

interface PollListProps {
  polls: Poll[];
  sessionId: string;
  sessionOpen?: boolean;
  onViewResults?: (pollId: string) => void;
}

/** Move item so it ends up immediately before `insertBefore` (0 … length). */
function reorderList<T>(items: T[], from: number, insertBefore: number): T[] {
  if (from === insertBefore || from + 1 === insertBefore) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  const to = insertBefore > from ? insertBefore - 1 : insertBefore;
  next.splice(to, 0, moved);
  return next;
}

function DropIndicator() {
  return (
    <li className="list-none -my-1 relative z-20 pointer-events-none" aria-hidden>
      <div className="flex items-center gap-2 py-0.5">
        <div className="h-0.5 flex-1 rounded-full bg-primary shadow-[0_0_8px_rgba(220,53,69,0.45)]" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-primary shrink-0">
          Drop here
        </span>
        <div className="h-0.5 flex-1 rounded-full bg-primary shadow-[0_0_8px_rgba(220,53,69,0.45)]" />
      </div>
    </li>
  );
}

export function PollList({
  polls,
  sessionId,
  sessionOpen = true,
  onViewResults,
}: PollListProps) {
  const [orderedPolls, setOrderedPolls] = useState<Poll[]>(() => sortPolls(polls));
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [ghostWidth, setGhostWidth] = useState<number | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const rowRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const dragFromRef = useRef<number | null>(null);
  const skipPollSyncRef = useRef(false);
  const confirm = useConfirm();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (skipPollSyncRef.current) {
      skipPollSyncRef.current = false;
      return;
    }
    setOrderedPolls(sortPolls(polls));
  }, [polls]);

  const canReorder = sessionOpen && orderedPolls.length > 1 && !reordering;
  const draggingPoll = dragIndex !== null ? orderedPolls[dragIndex] : null;

  async function persistOrder(next: Poll[]) {
    setReordering(true);
    try {
      const res = await hostFetch(`/api/session/${sessionId}/polls/reorder`, {
        method: "POST",
        body: JSON.stringify({ pollIds: next.map((p) => p.id) }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Could not save order.");
      }
      skipPollSyncRef.current = true;
      toast.success("Poll order updated.");
    } catch (e) {
      setOrderedPolls(sortPolls(polls));
      toast.error(e instanceof Error ? e.message : "Could not save order.");
    } finally {
      setReordering(false);
    }
  }

  function clearDrag() {
    dragFromRef.current = null;
    setDragIndex(null);
    setInsertIndex(null);
    document.body.style.cursor = "";
  }

  function finishDrag(insertBefore: number | null) {
    const from = dragFromRef.current;
    clearDrag();

    if (from === null || insertBefore === null) return;
    const next = reorderList(orderedPolls, from, insertBefore);
    if (next === orderedPolls) return;
    setOrderedPolls(next);
    void persistOrder(next);
  }

  function getInsertIndex(clientY: number): number {
    const items = listRef.current?.querySelectorAll<HTMLElement>("[data-poll-row]");
    if (!items?.length) return 0;
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (clientY < mid) return i;
    }
    return items.length;
  }

  function startPointerDrag(index: number, clientX: number, clientY: number) {
    if (!canReorder || orderedPolls[index]?.isActive) return;

    const row = rowRefs.current.get(index);
    if (row) setGhostWidth(row.offsetWidth);

    dragFromRef.current = index;
    setDragIndex(index);
    setInsertIndex(index);
    setPointer({ x: clientX, y: clientY });
    document.body.style.cursor = "grabbing";

    function onMove(e: PointerEvent) {
      if (dragFromRef.current === null) return;
      setPointer({ x: e.clientX, y: e.clientY });
      setInsertIndex(getInsertIndex(e.clientY));
    }

    function onUp(e: PointerEvent) {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      finishDrag(getInsertIndex(e.clientY));
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  }

  async function handleLaunch(pollId: string) {
    setLoadingId(pollId);
    try {
      const res = await hostFetch(`/api/session/${sessionId}/polls/${pollId}/launch`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Launch failed.");
      }
      toast.success("Poll is live.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Launch failed.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleClose(pollId: string) {
    setLoadingId(pollId);
    try {
      const res = await hostFetch(`/api/session/${sessionId}/polls/${pollId}/close`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Close failed.");
      }
      toast.success("Poll closed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Close failed.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(poll: Poll) {
    const ok = await confirm({
      title: `Delete "${poll.question}"?`,
      description: "All votes for this poll will be permanently removed.",
      confirmLabel: "Delete poll",
      variant: "danger",
    });
    if (!ok) return;
    setLoadingId(poll.id);
    try {
      const res = await hostFetch(`/api/session/${sessionId}/polls/${poll.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Delete failed.");
      }
      setEditingId(null);
      toast.success("Poll deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete poll.");
    } finally {
      setLoadingId(null);
    }
  }

  if (orderedPolls.length === 0) {
    return <p className="text-sm text-slate-500">No polls yet. Create one above.</p>;
  }

  const dragGhost =
    mounted && draggingPoll && dragIndex !== null
      ? createPortal(
          <div
            className="fixed z-[300] pointer-events-none rounded-xl border-2 border-primary bg-white px-4 py-3 shadow-2xl ring-4 ring-primary/15"
            style={{
              left: pointer.x + 14,
              top: pointer.y + 14,
              width: ghostWidth ? Math.min(ghostWidth, window.innerWidth - 32) : 320,
              transform: "rotate(-1deg) scale(1.02)",
            }}
          >
            <p className="text-sm font-semibold text-slate-900 line-clamp-2">
              {draggingPoll.question}
            </p>
            <p className="text-xs text-slate-500 mt-1">Release to place</p>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="space-y-2">
      {dragGhost}
      {canReorder && (
        <p className="text-xs text-slate-500">
          Drag the ⋮⋮ handle to reorder — follow the red line for where it will land.
        </p>
      )}
      <ul ref={listRef} className="space-y-3">
        {orderedPolls.map((poll, index) => (
          <Fragment key={poll.id}>
            {dragIndex !== null && insertIndex === index && <DropIndicator />}
            <li
              ref={(el) => {
                if (el) rowRefs.current.set(index, el);
                else rowRefs.current.delete(index);
              }}
              data-poll-row
              className={cn(
                "p-4 rounded-xl border bg-slate-50/50 transition-[box-shadow,opacity,transform] duration-150",
                dragIndex === index &&
                  "opacity-30 border-2 border-dashed border-primary/50 bg-primary/5 scale-[0.99]",
                dragIndex !== null &&
                  dragIndex !== index &&
                  "opacity-90",
                poll.isActive && dragIndex !== index
                  ? "border-primary/30 ring-1 ring-primary/10"
                  : dragIndex !== index && "border-slate-100"
              )}
            >
              <div
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                  dragIndex === index && "invisible"
                )}
              >
                <div className="flex flex-1 min-w-0 gap-3">
                  {canReorder && (
                    <div
                      role="button"
                      tabIndex={poll.isActive || reordering ? -1 : 0}
                      aria-label={
                        poll.isActive
                          ? "Cannot reorder while poll is live"
                          : `Drag to reorder: ${poll.question}`
                      }
                      aria-disabled={poll.isActive || reordering}
                      onPointerDown={(e) => {
                        if (poll.isActive || reordering || e.button !== 0) return;
                        e.preventDefault();
                        startPointerDrag(index, e.clientX, e.clientY);
                      }}
                      className={cn(
                        "mt-0.5 shrink-0 select-none rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/80 hover:text-slate-600",
                        poll.isActive || reordering
                          ? "cursor-not-allowed opacity-30"
                          : "cursor-grab active:cursor-grabbing touch-manipulation",
                        dragIndex === index && "cursor-grabbing"
                      )}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden
                      >
                        <circle cx="7" cy="5" r="1.25" />
                        <circle cx="13" cy="5" r="1.25" />
                        <circle cx="7" cy="10" r="1.25" />
                        <circle cx="13" cy="10" r="1.25" />
                        <circle cx="7" cy="15" r="1.25" />
                        <circle cx="13" cy="15" r="1.25" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-900">{poll.question}</p>
                      {poll.isActive && <Badge variant="live">Live</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {poll.options.join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap sm:pl-0 pl-9">
                  {sessionOpen &&
                    (!poll.isActive ? (
                      <Button
                        size="sm"
                        onClick={() => handleLaunch(poll.id)}
                        disabled={loadingId === poll.id || reordering}
                      >
                        Launch
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleClose(poll.id)}
                        disabled={loadingId === poll.id || reordering}
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
                          disabled={loadingId === poll.id || reordering}
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
                        disabled={loadingId === poll.id || reordering}
                      >
                        {editingId === poll.id ? "Cancel edit" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(poll)}
                        disabled={loadingId === poll.id || reordering}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {editingId === poll.id && !poll.isActive && dragIndex !== index && (
                <PollEditForm
                  sessionId={sessionId}
                  poll={poll}
                  onSaved={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </li>
          </Fragment>
        ))}
        {dragIndex !== null && insertIndex === orderedPolls.length && <DropIndicator />}
      </ul>
    </div>
  );
}
