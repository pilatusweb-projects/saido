"use client";

import type { Poll } from "@/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { LiveBarChart } from "@/components/charts/LiveBarChart";
import { usePollResults } from "@/hooks/usePollResults";
import { Badge } from "@/components/ui/Badge";
import { PollResultsNav } from "@/components/poll/PollResultsNav";
import { truncateLabel } from "@/lib/truncate-label";

interface PollResultsPanelProps {
  polls: Poll[];
  activePoll: Poll | null;
  selectedPollId: string | null;
  onSelectPoll: (pollId: string) => void;
}

export function PollResultsPanel({
  polls,
  activePoll,
  selectedPollId,
  onSelectPoll,
}: PollResultsPanelProps) {
  const displayPoll =
    polls.find((p) => p.id === selectedPollId) ??
    activePoll ??
    polls[0] ??
    null;
  const chartData = usePollResults(displayPoll);
  const isViewingLive = !!activePoll && displayPoll?.id === activePoll.id;

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <CardTitle>{isViewingLive ? "Live results" : "Poll results"}</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            {isViewingLive
              ? "Updates in real time while the poll is live."
              : "Votes are saved after you close a poll. Use Back / Next to browse polls."}
          </p>
        </div>
        {isViewingLive && <Badge variant="live">Live</Badge>}
      </div>

      {displayPoll && polls.length > 1 && (
        <PollResultsNav
          polls={polls}
          currentPollId={displayPoll.id}
          onSelect={onSelectPoll}
        />
      )}

      <div className="mt-4">
        {displayPoll ? (
          <>
            <p
              className="text-sm font-medium text-slate-800 mb-3 line-clamp-2"
              title={displayPoll.question}
            >
              {truncateLabel(displayPoll.question, 120)}
            </p>
            <LiveBarChart data={chartData} pollId={displayPoll.id} />
          </>
        ) : (
          <p className="text-sm text-slate-500 py-8 text-center">
            Create and launch a poll to see results here.
          </p>
        )}
      </div>
    </Card>
  );
}
