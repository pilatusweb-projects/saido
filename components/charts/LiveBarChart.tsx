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

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "Votes",
        data: data.values,
        backgroundColor: "rgba(220, 53, 69, 0.85)",
        borderColor: "rgba(220, 53, 69, 1)",
        borderWidth: 1,
        borderRadius: 8,
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
        ? { display: true, text: question, font: { size: 14 } }
        : { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">{data.totalVotes} vote{data.totalVotes !== 1 ? "s" : ""}</p>
      <div className="h-56 sm:h-64">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
