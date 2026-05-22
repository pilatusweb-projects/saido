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
  type TooltipItem,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { PollChartData } from "@/hooks/usePollResults";
import { getBarChartColors } from "@/lib/chart-colors";
import { cn } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface LiveBarChartProps {
  data: PollChartData;
  question?: string;
  size?: "default" | "presenter";
  pollId?: string;
  hideVoteLine?: boolean;
}

/** Short column keys under vertical bars (A, B, …) — full text lives in the legend */
function columnKeys(count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    i < 26 ? String.fromCharCode(65 + i) : String(i + 1)
  );
}

function ChartOptionLegend({
  labels,
  values,
  colors,
  pollId,
  isPresenter,
}: {
  labels: string[];
  values: number[];
  colors: ReturnType<typeof getBarChartColors>;
  pollId?: string;
  isPresenter: boolean;
}) {
  const keys = columnKeys(labels.length);

  return (
    <ul
      className={cn(
        "mt-4 space-y-3",
        isPresenter ? "border-t border-slate-700 pt-4" : "border-t border-slate-100 pt-4"
      )}
      aria-label="Poll options"
    >
      {labels.map((label, i) => (
        <li
          key={`${pollId ?? "opt"}-${i}`}
          className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-0.5"
        >
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
            style={{ backgroundColor: colors.backgroundColor[i] }}
            aria-hidden
          >
            {keys[i]}
          </span>
          <p
            className={cn(
              "min-w-0 text-sm leading-snug break-words",
              isPresenter ? "text-slate-300" : "text-slate-700"
            )}
            title={label}
          >
            {label}
          </p>
          <span
            className={cn(
              "shrink-0 tabular-nums text-sm font-semibold",
              isPresenter ? "text-slate-100" : "text-slate-900"
            )}
          >
            {values[i] ?? 0}
          </span>
        </li>
      ))}
    </ul>
  );
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
  const shortLabels = useMemo(() => columnKeys(fullLabels.length), [fullLabels.length]);

  const colors = useMemo(
    () => getBarChartColors(fullLabels.length),
    [fullLabels.length]
  );

  const chartData = useMemo(
    () => ({
      labels: shortLabels,
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
    [shortLabels, data.values, colors]
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
      layout: {
        padding: { top: 4, right: 8, bottom: 4, left: 4 },
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
            label: (ctx: TooltipItem<"bar">) => {
              const i = ctx.dataIndex ?? 0;
              const name = fullLabels[i] ?? "";
              const votes = ctx.parsed.y ?? 0;
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
              size: isPresenter ? 14 : 12,
              weight: "bold" as const,
            },
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,
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
            ? "flex-1 min-h-[200px] sm:min-h-[260px] lg:min-h-[320px] overflow-hidden"
            : "h-52 sm:h-60 overflow-hidden w-full"
        }
      >
        <Bar
          key={pollId ?? "chart"}
          data={chartData}
          options={options}
          updateMode="none"
        />
      </div>

      <ChartOptionLegend
        labels={fullLabels}
        values={data.values}
        colors={colors}
        pollId={pollId}
        isPresenter={isPresenter}
      />
    </div>
  );
}
