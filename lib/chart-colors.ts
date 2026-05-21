/**
 * Distinct bar colors for poll results — high contrast, color-blind friendly hues.
 * Cycles when there are more options than palette entries.
 */
export const CHART_BAR_PALETTE = [
  { fill: "rgba(220, 53, 69, 0.9)", border: "rgb(187, 45, 58)" },
  { fill: "rgba(37, 99, 235, 0.9)", border: "rgb(29, 78, 216)" },
  { fill: "rgba(5, 150, 105, 0.9)", border: "rgb(4, 120, 87)" },
  { fill: "rgba(217, 119, 6, 0.9)", border: "rgb(180, 83, 9)" },
  { fill: "rgba(124, 58, 237, 0.9)", border: "rgb(109, 40, 217)" },
  { fill: "rgba(219, 39, 119, 0.9)", border: "rgb(190, 24, 93)" },
  { fill: "rgba(8, 145, 178, 0.9)", border: "rgb(14, 116, 144)" },
  { fill: "rgba(101, 163, 13, 0.9)", border: "rgb(77, 124, 15)" },
  { fill: "rgba(234, 88, 12, 0.9)", border: "rgb(194, 65, 12)" },
  { fill: "rgba(79, 70, 229, 0.9)", border: "rgb(67, 56, 202)" },
] as const;

export function getBarChartColors(count: number): {
  backgroundColor: string[];
  borderColor: string[];
  hoverBackgroundColor: string[];
} {
  const backgroundColor: string[] = [];
  const borderColor: string[] = [];
  const hoverBackgroundColor: string[] = [];

  for (let i = 0; i < count; i++) {
    const c = CHART_BAR_PALETTE[i % CHART_BAR_PALETTE.length];
    backgroundColor.push(c.fill);
    borderColor.push(c.border);
    hoverBackgroundColor.push(c.border);
  }

  return { backgroundColor, borderColor, hoverBackgroundColor };
}
