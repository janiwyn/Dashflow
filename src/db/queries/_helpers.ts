import "server-only";

import { getActiveBranchScope, getActiveBusinessId } from "@/lib/session";

/**
 * Every query in this layer is tenant-scoped. Resolving the business id here
 * keeps the `where` clauses in one place rather than threading it through
 * every page component.
 */
export const businessScope = getActiveBusinessId;

/**
 * Resolves the branch a manager/staff account is locked to (or `undefined`
 * for admin/super, who see every branch). Combine with an explicit
 * `options.branchId` like: `options?.branchId ?? (await branchScope())` —
 * or, safer, let the enforced scope win outright with `enforcedBranchId(options?.branchId)`.
 */
export const branchScope = getActiveBranchScope;

/**
 * Resolves the branchId a query should filter on: the caller's requested
 * branch (e.g. from a filter dropdown) narrowed by whatever the signed-in
 * user is actually allowed to see. A manager/staff member can never widen
 * their view by passing a different branchId — their enforced branch always
 * wins.
 */
export async function enforcedBranchId(requested?: number): Promise<number | undefined> {
  const enforced = await branchScope();
  if (enforced != null) return enforced;
  return requested;
}

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
