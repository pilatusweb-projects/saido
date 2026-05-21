/** Truncate long chart / UI labels with an ellipsis. */
export function truncateLabel(text: string, maxLength = 28): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}
