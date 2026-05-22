import type { Poll } from "@/types";

/**
 * Slido-style order: first poll in the list = 1, then 2, 3…
 * Uses explicit `sortOrder` when set; otherwise oldest-first by creation time.
 */
export function sortPolls(polls: Poll[]): Poll[] {
  return [...polls].sort((a, b) => {
    const ao = a.sortOrder;
    const bo = b.sortOrder;
    if (ao != null && bo != null) return ao - bo;
    if (ao != null) return -1;
    if (bo != null) return 1;
    return a.createdAt.toMillis() - b.createdAt.toMillis();
  });
}
