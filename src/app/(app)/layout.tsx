import { eq } from "drizzle-orm";
import type { ReactNode } from "react";

import { CurrencyProvider } from "@/components/currency-provider";
import { SessionProvider } from "@/components/session-provider";
import { db } from "@/db";
import { branches, businesses } from "@/db/schema";
import { label } from "@/lib/format";
import type { CurrencyCode } from "@/lib/currency";
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

  const [branchRow, businessRow] = await Promise.all([
    user.branchId
      ? db.select({ name: branches.name }).from(branches).where(eq(branches.id, user.branchId)).limit(1).then((r) => r[0])
      : Promise.resolve(undefined),
    db.select({ currency: businesses.currency }).from(businesses).where(eq(businesses.id, user.businessId ?? 1)).limit(1).then((r) => r[0]),
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
      }}
    >
      <CurrencyProvider code={(businessRow?.currency as CurrencyCode) ?? "KES"}>
        {children}
      </CurrencyProvider>
    </SessionProvider>
  );
}
