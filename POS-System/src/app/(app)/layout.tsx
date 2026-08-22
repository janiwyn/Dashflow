import { count, eq } from "drizzle-orm";
import type { ReactNode } from "react";

import { CurrencyProvider } from "@/components/currency-provider";
import { ModulesProvider } from "@/components/modules-provider";
import { PrinterProvider } from "@/components/printer-provider";
import { SessionProvider } from "@/components/session-provider";
import { db } from "@/db";
import { branches, businesses } from "@/db/schema";
import { getActiveModuleKeys } from "@/db/queries/modules";
import { label } from "@/lib/format";
import type { CurrencyCode } from "@/lib/currency";
import { MODULE_KEYS } from "@/lib/modules";
import { isPlanKey } from "@/lib/plans";
import { requireUser } from "@/lib/session";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

/**
 * Guards every authenticated screen and publishes the signed-in user (and
 * their business's currency setting) to the client tree, so AppShell, the
 * sidebar, and any component using useCurrency() render real data.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  const [branchRow, businessRow, activeModules, branchCount] = await Promise.all([
    user.branchId
      ? db.select({ name: branches.name }).from(branches).where(eq(branches.id, user.branchId)).limit(1).then((r) => r[0])
      : Promise.resolve(undefined),
    db.select({ currency: businesses.currency, planKey: businesses.planKey }).from(businesses).where(eq(businesses.id, user.businessId ?? 1)).limit(1).then((r) => r[0]),
    // The super admin operates the platform rather than a single tenant, so
    // every module's UI stays reachable to them regardless of any one
    // business's subscription.
    user.role === "super" ? Promise.resolve(new Set(MODULE_KEYS)) : getActiveModuleKeys(user.businessId ?? 1),
    user.businessId
      ? db.select({ total: count(branches.id) }).from(branches).where(eq(branches.businessId, user.businessId)).then((r) => Number(r[0]?.total ?? 0))
      : Promise.resolve(0),
  ]);

  return (
    <SessionProvider
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role ?? "staff",
        roleLabel: label(user.role ?? "staff"),
        branch: branchRow?.name ?? null,
        branchId: user.branchId ?? null,
        initials: initialsOf(user.name),
        hasMultipleBranches: branchCount > 1,
        planKey: isPlanKey(businessRow?.planKey) ? businessRow.planKey : null,
      }}
    >
      <CurrencyProvider code={(businessRow?.currency as CurrencyCode) ?? "UGX"}>
        <ModulesProvider activeModules={Array.from(activeModules)}>
          <PrinterProvider>{children}</PrinterProvider>
        </ModulesProvider>
      </CurrencyProvider>
    </SessionProvider>
  );
}
