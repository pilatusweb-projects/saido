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
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getBarChartColors } from "@/lib/chart-colors";
import { truncateLabel } from "@/lib/truncate-label";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface LiveBarChartProps {
  data: PollChartData;
  question?: string;
  size?: "default" | "presenter";
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
  const isMobile = useMediaQuery("(max-width: 639px)");
  const isNarrowViewport = useMediaQuery("(max-width: 1023px)");
  const useHorizontal = (!isPresenter && isMobile) || (isPresenter && isNarrowViewport);

  const empty = data.labels.length === 0;
  const fullLabels = data.labels;

  const colors = useMemo(
    () => getBarChartColors(fullLabels.length),
    [fullLabels.length]
  );

  const axisLabelLen = useHorizontal ? 36 : isPresenter ? 22 : 28;
  const displayLabels = useMemo(
    () => fullLabels.map((l) => truncateLabel(l, axisLabelLen)),
    [fullLabels, axisLabelLen]
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
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    }),
    [displayLabels, data.values, colors]
  );

  const options = useMemo(
    () => ({
      indexAxis: useHorizontal ? ("y" as const) : ("x" as const),
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      transitions: {
        active: { animation: { duration: 0 } },
        resize: { animation: { duration: 200 } },
      },
      layout: {
        padding: useHorizontal
          ? { left: 4, right: 12, top: 4, bottom: 4 }
          : { left: 0, right: 0, top: 0, bottom: 8 },
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
              const votes = useHorizontal
                ? (ctx.parsed.x ?? 0)
                : (ctx.parsed.y ?? 0);
              return `${name}: ${votes} vote${votes !== 1 ? "s" : ""}`;
            },
          },
        },
      },
      scales: useHorizontal
        ? {
            x: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                precision: 0,
                color: isPresenter ? "#94a3b8" : "#64748b",
                font: { size: 11 },
              },
              grid: {
                color: isPresenter
                  ? "rgba(148, 163, 184, 0.15)"
                  : "rgba(148, 163, 184, 0.25)",
              },
              border: { display: false },
            },
            y: {
              ticks: {
                color: isPresenter ? "#cbd5e1" : "#475569",
                font: { size: 11 },
                autoSkip: false,
                crossAlign: "far" as const,
              },
              grid: { display: false },
              border: { display: false },
            },
          }
        : {
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
                autoSkip: false,
              },
              grid: { display: false },
              border: { display: false },
            },
          },
    }),
    [isPresenter, question, fullLabels, useHorizontal]
  );

  const chartHeight = useHorizontal
    ? Math.max(isPresenter ? 200 : 140, fullLabels.length * 44 + 32)
    : isPresenter
      ? undefined
      : 224;

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
          isPresenter && !useHorizontal
            ? "flex-1 min-h-[280px] sm:min-h-[360px] lg:min-h-[420px] overflow-hidden"
            : "overflow-hidden w-full"
        }
        style={
          useHorizontal
            ? { height: chartHeight, minHeight: chartHeight }
            : isPresenter
              ? undefined
              : { height: chartHeight }
        }
      >
        <Bar
          key={`${pollId ?? "chart"}-${useHorizontal ? "h" : "v"}`}
          data={chartData}
          options={options}
          updateMode="none"
        />
      </div>

      {useHorizontal && (
        <ul
          className={
            isPresenter
              ? "mt-3 space-y-2 border-t border-slate-700 pt-3"
              : "mt-3 space-y-2 border-t border-slate-100 pt-3"
          }
          aria-label="Poll options"
        >
          {fullLabels.map((label, i) => (
            <li key={`${pollId ?? "opt"}-${i}`} className="flex items-start gap-2 text-xs">
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: colors.backgroundColor[i] }}
                aria-hidden
              />
              <span
                className={
                  isPresenter
                    ? "min-w-0 flex-1 break-words text-slate-300 leading-snug"
                    : "min-w-0 flex-1 break-words text-slate-600 leading-snug"
                }
              >
                {label}
              </span>
              <span
                className={
                  isPresenter
                    ? "shrink-0 tabular-nums font-medium text-slate-100"
                    : "shrink-0 tabular-nums font-medium text-slate-800"
                }
              >
                {data.values[i] ?? 0}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
