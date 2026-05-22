"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { PollChartData } from "@/hooks/usePollResults";
import { getBarChartColors } from "@/lib/chart-colors";
import { truncateLabel } from "@/lib/truncate-label";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface LiveBarChartProps {
  data: PollChartData;
  question?: string;
  size?: "default" | "presenter";
  /** Remount chart only when switching polls (not on each vote) */
  pollId?: string;
  hideVoteLine?: boolean;
}

export function LiveBarChart({
  data,
  question,
  size = "default",
  pollId,
  hideVoteLine = false,
}: LiveBarChartProps) {
  const isPresenter = size === "presenter";
  const empty = data.labels.length === 0;
  const fullLabels = data.labels;
  const maxLabelLen = isPresenter ? 22 : 28;
  const displayLabels = useMemo(
    () => fullLabels.map((l) => truncateLabel(l, maxLabelLen)),
    [fullLabels, maxLabelLen]
  );

  const colors = useMemo(
    () => getBarChartColors(fullLabels.length),
    [fullLabels.length]
  );

  const chartData = useMemo(
    () => ({
      labels: displayLabels,
      datasets: [
        {
          label: "Votes",
          data: data.values,
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          hoverBackgroundColor: colors.hoverBackgroundColor,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }),
    [displayLabels, data.values, colors]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      transitions: {
        active: { animation: { duration: 0 } },
        resize: { animation: { duration: 200 } },
      },
      plugins: {
        legend: { display: false },
        title:
          question && !isPresenter
            ? {
                display: true,
                text: question,
                font: { size: 14, weight: "bold" as const },
                color: "#334155",
                padding: { bottom: 12 },
              }
            : { display: false },
        tooltip: {
          backgroundColor: "#0f172a",
          titleFont: { size: 13, weight: "bold" as const },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            title: (items: { dataIndex?: number }[]) => {
              const i = items[0]?.dataIndex;
              return i !== undefined ? fullLabels[i] ?? "" : "";
            },
            label: (ctx: { dataIndex?: number; parsed?: { y: number | null } }) => {
              const i = ctx.dataIndex ?? 0;
              const name = fullLabels[i] ?? "";
              const votes = ctx.parsed?.y ?? 0;
              return `${name}: ${votes} vote${votes !== 1 ? "s" : ""}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0,
            color: isPresenter ? "#94a3b8" : "#64748b",
            font: { size: isPresenter ? 14 : 11 },
          },
          grid: {
            color: isPresenter
              ? "rgba(148, 163, 184, 0.15)"
              : "rgba(148, 163, 184, 0.25)",
          },
          border: { display: false },
        },
        x: {
          ticks: {
            color: isPresenter ? "#cbd5e1" : "#475569",
            font: {
              size: isPresenter ? 13 : 11,
              weight: isPresenter ? ("bold" as const) : undefined,
            },
            maxRotation: 0,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12,
          },
          grid: { display: false },
          border: { display: false },
        },
      },
    }),
    [isPresenter, question, fullLabels]
  );

  if (empty) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-400 text-sm">
        No poll active
      </div>
    );
  }

  return (
    <div className={isPresenter ? "h-full flex flex-col min-h-0" : undefined}>
      {!hideVoteLine && (
        <p
          className={isPresenter ? "sr-only" : "text-xs text-slate-500 mb-2"}
          aria-live="polite"
        >
          {data.totalVotes} vote{data.totalVotes !== 1 ? "s" : ""}
        </p>
      )}
      <div
        className={
          isPresenter
            ? "flex-1 min-h-[280px] sm:min-h-[360px] lg:min-h-[420px] overflow-hidden"
            : "h-56 sm:h-64 overflow-hidden"
        }
      >
        <Bar
          key={pollId ?? "chart"}
          data={chartData}
          options={options}
          updateMode="none"
        />
      </div>
    </div>
  );
}
