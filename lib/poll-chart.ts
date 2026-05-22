import type { PollChartData } from "@/hooks/usePollResults";
import type { Response } from "@/types";

export function buildPollChartData(
  options: string[],
  responses: Pick<Response, "answer">[]
): PollChartData {
  const counts: Record<string, number> = {};
  options.forEach((opt) => {
    counts[opt] = 0;
  });
  responses.forEach((r) => {
    if (counts[r.answer] !== undefined) counts[r.answer]++;
  });
  const values = options.map((l) => counts[l] ?? 0);
  return {
    labels: options,
    values,
    totalVotes: responses.length,
  };
}
