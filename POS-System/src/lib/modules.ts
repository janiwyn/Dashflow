import {
  BadgeDollarSign,
  Boxes,
  Briefcase,
  Calculator,
  CalendarClock,
  ScanBarcode,
  Truck,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { moduleKey } from "@/db/schema/subscriptions";

/** The platform's fixed module catalog, in the order they're presented. */
export const MODULE_KEYS = moduleKey.enumValues;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export type ModuleDefinition = {
  key: ModuleKey;
  label: string;
  description: string;
  icon: LucideIcon;
  /** UGX, per business per month — shown on the marketing site and at checkout. */
  monthlyPrice: number;
};

/**
 * Display metadata for each module, shared by the sidebar, the super-admin
 * subscription screen, the business-facing /subscription page, and the
 * public pricing/checkout flow (/subscribe). Business logic (schema,
 * actions, pages) lives in each module's own files — this is only the
 * catalog entry.
 */
export const MODULE_CATALOG: Record<ModuleKey, ModuleDefinition> = {
  pos: {
    key: "pos",
    label: "Point of Sale",
    description: "Checkout terminal, receipts, till and cash drawer management.",
    icon: ScanBarcode,
    monthlyPrice: 50000,
  },
  inventory: {
    key: "inventory",
    label: "Inventory Management",
    description: "Stock levels, pricing, product catalog and expiry tracking.",
    icon: Boxes,
    monthlyPrice: 40000,
  },
  sales: {
    key: "sales",
    label: "Sales Management",
    description: "Sales history, remote orders, payment proofs and reporting.",
    icon: BadgeDollarSign,
    monthlyPrice: 40000,
  },
  accounting: {
    key: "accounting",
    label: "Accounting",
    description: "Ledgers, cash book, petty cash and financial statements.",
    icon: Calculator,
    monthlyPrice: 60000,
  },
  procurement: {
    key: "procurement",
    label: "Procurement",
    description: "Supplier accounts, delivery history and payables.",
    icon: Truck,
    monthlyPrice: 40000,
  },
  customers: {
    key: "customers",
    label: "Customer Management",
    description: "Customer records, purchase history and debtor tracking.",
    icon: UsersRound,
    monthlyPrice: 30000,
  },
  hr: {
    key: "hr",
    label: "Human Resources",
    description: "Employee records, positions and branch assignments.",
    icon: Briefcase,
    monthlyPrice: 50000,
  },
  attendance: {
    key: "attendance",
    label: "Attendance",
    description: "Staff clock-in/clock-out and shift tracking.",
    icon: CalendarClock,
    monthlyPrice: 30000,
  },
  payroll: {
    key: "payroll",
    label: "Payroll",
    description: "Salary runs, deductions and payslips.",
    icon: Wallet,
    monthlyPrice: 50000,
  },
};

export const MODULE_LIST: ModuleDefinition[] = MODULE_KEYS.map((key) => MODULE_CATALOG[key]);

const MODULE_KEY_SET = new Set<string>(MODULE_KEYS);

/** Parses a comma-separated `?modules=pos,inventory` query value, dropping anything unrecognised. */
export function parseModuleKeys(raw: string | null | undefined): ModuleKey[] {
  if (!raw) return [];
  const seen = new Set<ModuleKey>();
  for (const part of raw.split(",")) {
    const key = part.trim();
    if (MODULE_KEY_SET.has(key)) seen.add(key as ModuleKey);
  }
  return Array.from(seen);
}

export function modulesMonthlyTotal(keys: ModuleKey[]): number {
  return keys.reduce((sum, k) => sum + MODULE_CATALOG[k].monthlyPrice, 0);
}

/**
 * A distinct, recognisable colour per module — deliberately not the app's
 * own accent tokens, which would make every tile look the same. Used by the
 * marketing modules grid and the /subscribe checkout, both of which present
 * modules as a colourful "app grid" rather than the plain admin UI.
 */
export const MODULE_TILE_STYLE: Record<ModuleKey, string> = {
  pos: "bg-blue-50 text-blue-600",
  inventory: "bg-amber-50 text-amber-600",
  sales: "bg-emerald-50 text-emerald-600",
  accounting: "bg-violet-50 text-violet-600",
  procurement: "bg-cyan-50 text-cyan-600",
  customers: "bg-rose-50 text-rose-600",
  hr: "bg-teal-50 text-teal-600",
  attendance: "bg-indigo-50 text-indigo-600",
  payroll: "bg-lime-50 text-lime-700",
};
