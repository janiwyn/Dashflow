// Deliberately not "server-only" — everything here is pure date math with no
// secrets or DB access, and daysUntil() is genuinely useful for a live
// trial-countdown display in client components (e.g. the Settings page).

/** Every new business gets this many free days before a payment is required. */
export const TRIAL_DAYS = 14;

const toDateOnly = (d: Date) => d.toISOString().slice(0, 10);

export function trialEndFor(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return toDateOnly(end);
}

export function subscriptionEndFor(start: Date, period: "monthly" | "annual"): string {
  const end = new Date(start);
  if (period === "annual") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return toDateOnly(end);
}

/**
 * A renewal (or a first payment after the trial) extends from the later of
 * "today" and the current `subscriptionEnd" — paying a few days early adds
 * to the remaining time instead of wasting it, but a lapsed subscription
 * always resumes counting from the moment it's actually paid for.
 */
export function extendSubscriptionEnd(currentEnd: string | null, period: "monthly" | "annual"): string {
  const today = new Date();
  const current = currentEnd ? new Date(currentEnd) : today;
  const base = current > today ? current : today;
  return subscriptionEndFor(base, period);
}

/**
 * Whether a business currently has paid/trial access — the single source of
 * truth the (app) layout gates on. Independent of `subscriptionStatus`'s
 * label (which is informational, set alongside this for display) so a stale
 * or manually-mis-set status can never itself grant or deny access: only the
 * business's own suspension flag and the actual end date matter.
 */
export function hasActiveAccess(business: { status: "active" | "suspended"; subscriptionEnd: string | null }): boolean {
  if (business.status === "suspended") return false;
  if (!business.subscriptionEnd) return false;
  return business.subscriptionEnd >= toDateOnly(new Date());
}

/** Days remaining until `subscriptionEnd` (negative once it's lapsed). Used for trial-ending banners. */
export function daysUntil(subscriptionEnd: string | null): number | null {
  if (!subscriptionEnd) return null;
  const end = new Date(`${subscriptionEnd}T00:00:00`);
  const today = new Date(toDateOnly(new Date()) + "T00:00:00");
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}
