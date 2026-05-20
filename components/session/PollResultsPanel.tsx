"use client";

import type { Poll } from "@/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { LiveBarChart } from "@/components/charts/LiveBarChart";
import { usePollResults } from "@/hooks/usePollResults";
import { Badge } from "@/components/ui/Badge";

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
    activePoll ?? polls.find((p) => p.id === selectedPollId) ?? polls[0] ?? null;
  const chartData = usePollResults(displayPoll);

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <CardTitle>{activePoll ? "Live results" : "Poll results"}</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            {activePoll
              ? "Updates in real time while the poll is live."
              : "Votes are saved after you close a poll. Pick a poll to review."}
          </p>
        </div>
        {activePoll && <Badge variant="live">Live</Badge>}
      </div>

      {!activePoll && polls.length > 1 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            View results for
          </label>
          <select
            value={displayPoll?.id ?? ""}
            onChange={(e) => onSelectPoll(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {polls.map((p) => (
              <option key={p.id} value={p.id}>
                {p.question}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-4">
        {displayPoll ? (
          <LiveBarChart data={chartData} question={displayPoll.question} />
        ) : (
          <p className="text-sm text-slate-500 py-8 text-center">
            Create and launch a poll to see results here.
          </p>
        )}
      </div>
    </Card>
  );
}
