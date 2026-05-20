import type { Poll, Response } from "@/types";
import { getPollsForSession, getResponsesForPoll } from "./firestore";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function aggregateVotes(poll: Poll, responses: Response[]) {
  const counts: Record<string, number> = {};
  poll.options.forEach((opt) => {
    counts[opt] = 0;
  });
  responses.forEach((r) => {
    if (counts[r.answer] !== undefined) {
      counts[r.answer]++;
    }
  });
  return counts;
}

export async function buildSessionCsv(sessionId: string): Promise<string> {
  const polls = await getPollsForSession(sessionId);
  const lines: string[] = [];

  lines.push("Poll Question,Option,Vote Count");
  for (const poll of polls) {
    const responses = await getResponsesForPoll(poll.id);
    const counts = aggregateVotes(poll, responses);
    for (const opt of poll.options) {
      lines.push(
        [
          escapeCsv(poll.question),
          escapeCsv(opt),
          String(counts[opt] ?? 0),
        ].join(",")
      );
    }
    lines.push("");
  }

  lines.push("--- Raw Responses ---");
  lines.push("Poll Question,Participant Name,Answer");
  for (const poll of polls) {
    const responses = await getResponsesForPoll(poll.id);
    for (const r of responses) {
      lines.push(
        [
          escapeCsv(poll.question),
          escapeCsv(r.participantName ?? "Anonymous"),
          escapeCsv(r.answer),
        ].join(",")
      );
    }
  }

  return lines.join("\n");
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
