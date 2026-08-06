import "server-only";

import { getActiveBusinessId } from "@/lib/session";

/**
 * Every query in this layer is tenant-scoped. Resolving the business id here
 * keeps the `where` clauses in one place rather than threading it through
 * every page component.
 */
export const businessScope = getActiveBusinessId;

/** Postgres NUMERIC comes back as `number` (mode:"number") but may be null. */
export const num = (v: number | null | undefined) => Number(v ?? 0);

export const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const daysAgo = (n: number) => {
  const x = startOfDay(new Date());
  x.setDate(x.getDate() - n);
  return x;
};
