import type { Poll } from "@/types";

/** Host-facing poll order (explicit sortOrder, else legacy newest-first). */
export function sortPolls(polls: Poll[]): Poll[] {
  return [...polls].sort((a, b) => {
    const ao = a.sortOrder;
    const bo = b.sortOrder;
    if (ao != null && bo != null) return ao - bo;
    if (ao != null) return -1;
    if (bo != null) return 1;
    return b.createdAt.toMillis() - a.createdAt.toMillis();
  });
}
