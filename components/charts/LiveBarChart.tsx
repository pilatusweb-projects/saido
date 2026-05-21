"use client";

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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface LiveBarChartProps {
  data: PollChartData;
  question?: string;
}

export function LiveBarChart({ data, question }: LiveBarChartProps) {
  if (data.labels.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-400 text-sm">
        No poll active
      </div>
    );
  }

  const colors = getBarChartColors(data.labels.length);

  const chartData = {
    labels: data.labels,
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
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { display: false },
      title: question
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
          label: (ctx: { label?: string; parsed?: { y: number | null } }) => {
            const votes = ctx.parsed?.y ?? 0;
            return `${ctx.label}: ${votes} vote${votes !== 1 ? "s" : ""}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0, color: "#64748b" },
        grid: { color: "rgba(148, 163, 184, 0.25)" },
        border: { display: false },
      },
      x: {
        ticks: { color: "#475569", font: { size: 12 } },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">
        {data.totalVotes} vote{data.totalVotes !== 1 ? "s" : ""}
      </p>
      <div className="h-56 sm:h-64">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
