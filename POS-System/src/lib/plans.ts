import { MODULE_KEYS, type ModuleKey } from "./modules";

/**
 * Packaged pricing tiers, sold ahead of the à-la-carte module grid. A small
 * shop and a large wholesaler shouldn't pay the same way — each tier bundles
 * the modules a business at that size actually needs and caps usage (users,
 * branches) rather than crippling functionality, so every tier gets the real
 * module, just sized to the business. A business can still skip packages
 * entirely and build a custom set from individual modules (planKey stays
 * null in that case).
 */
export const PLAN_KEYS = ["starter", "retail", "business", "professional", "enterprise"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export type PlanDefinition = {
  key: PlanKey;
  label: string;
  tagline: string;
  /** UGX per month. Null means "custom" (Enterprise) — startingPrice is shown instead. */
  monthlyPrice: number | null;
  /** Only set when monthlyPrice is null — "From UGX X/mo, contact us". */
  startingPrice?: number;
  moduleKeys: ModuleKey[];
  /** Null means no fixed cap ("multiple"/unlimited for this tier). */
  maxUsers: number | null;
  maxBranches: number | null;
  popular?: boolean;
  highlights: string[];
};

export const PLAN_CATALOG: Record<PlanKey, PlanDefinition> = {
  starter: {
    key: "starter",
    label: "Starter",
    tagline: "For very small shops just getting off the ground.",
    monthlyPrice: 50000,
    moduleKeys: ["pos", "inventory", "sales"],
    maxUsers: 1,
    maxBranches: 1,
    highlights: ["Point of Sale", "Inventory", "Sales & reports", "1 user", "1 branch"],
  },
  retail: {
    key: "retail",
    label: "Retail",
    tagline: "For shops that are growing and need a bit more room.",
    monthlyPrice: 100000,
    moduleKeys: ["pos", "inventory", "sales", "customers", "procurement"],
    maxUsers: 3,
    maxBranches: 1,
    popular: true,
    highlights: ["Everything in Starter", "Customer management", "Procurement", "Up to 3 users", "1 branch"],
  },
  business: {
    key: "business",
    label: "Business",
    tagline: "For wholesalers and medium businesses running real volume.",
    monthlyPrice: 200000,
    moduleKeys: ["pos", "inventory", "sales", "procurement", "customers", "accounting"],
    maxUsers: 10,
    maxBranches: 3,
    highlights: ["Everything in Retail", "Accounting", "Supplier management", "Up to 10 users", "Up to 3 branches"],
  },
  professional: {
    key: "professional",
    label: "Professional",
    tagline: "For larger, multi-branch businesses with staff to manage.",
    monthlyPrice: 350000,
    moduleKeys: ["pos", "inventory", "sales", "procurement", "customers", "accounting", "hr", "attendance", "payroll"],
    maxUsers: 25,
    maxBranches: null,
    highlights: ["Everything in Business", "HR, Attendance & Payroll", "Advanced reports", "Up to 25 users", "Multiple branches"],
  },
  enterprise: {
    key: "enterprise",
    label: "Enterprise",
    tagline: "For companies with complex, custom requirements.",
    monthlyPrice: null,
    startingPrice: 700000,
    moduleKeys: [...MODULE_KEYS],
    maxUsers: null,
    maxBranches: null,
    highlights: [
      "Every module",
      "Unlimited users & branches",
      "Advanced permissions & audit logs",
      "Custom workflows & integrations",
      "Dedicated support",
    ],
  },
};

export const PLAN_LIST: PlanDefinition[] = PLAN_KEYS.map((key) => PLAN_CATALOG[key]);

export function isPlanKey(value: string | null | undefined): value is PlanKey {
  return !!value && (PLAN_KEYS as readonly string[]).includes(value);
}

/** 2 months free — this is the whole pitch for paying annually, so keep the multiplier obvious and in one place. */
export function annualPrice(monthlyPrice: number): number {
  return monthlyPrice * 10;
}

/**
 * Tier order, lowest first — for gating a specific screen (not just a whole
 * module) to "this plan or higher", e.g. Remote Orders needing Retail+ even
 * though the Sales module itself is already available on Starter.
 */
export function planRank(key: PlanKey): number {
  return PLAN_KEYS.indexOf(key);
}

/** True if `key` is planRank-or-higher than `min` — a business with no package (planKey null) is never restricted by this, since tier gating only applies to businesses actually on a package. */
export function meetsPlanTier(key: PlanKey | null, min: PlanKey): boolean {
  if (!key) return true;
  return planRank(key) >= planRank(min);
}
