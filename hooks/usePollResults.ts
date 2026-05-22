"use client";

import { useEffect, useState } from "react";
import { subscribeToPollResponses } from "@/lib/firestore";
import type { Poll } from "@/types";

export interface PollChartData {
  labels: string[];
  values: number[];
  totalVotes: number;
}

export function usePollResults(poll: Poll | null): PollChartData {
  const [data, setData] = useState<PollChartData>({
    labels: poll?.options ?? [],
    values: (poll?.options ?? []).map(() => 0),
    totalVotes: 0,
  });

  useEffect(() => {
    if (!poll) {
      setData({ labels: [], values: [], totalVotes: 0 });
      return;
    }

    const labels = poll.options;
    const unsub = subscribeToPollResponses(poll.id, (responses) => {
      const counts: Record<string, number> = {};
      labels.forEach((opt) => {
        counts[opt] = 0;
      });
      responses.forEach((r) => {
        if (counts[r.answer] !== undefined) {
          counts[r.answer]++;
        }
      });
      const values = labels.map((l) => counts[l] ?? 0);
      const totalVotes = responses.length;
      setData((prev) => {
        if (
          prev.labels.length === labels.length &&
          prev.labels.every((l, i) => l === labels[i]) &&
          prev.totalVotes === totalVotes &&
          prev.values.every((v, i) => v === values[i])
        ) {
          return prev;
        }
        return { labels, values, totalVotes };
      });
    });

    return unsub;
  }, [poll?.id, poll?.options]);

  return data;
}
