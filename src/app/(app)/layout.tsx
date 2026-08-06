import { eq } from "drizzle-orm";
import type { ReactNode } from "react";

import { SessionProvider } from "@/components/session-provider";
import { db } from "@/db";
import { branches } from "@/db/schema";
import { label } from "@/lib/format";
import { requireUser } from "@/lib/session";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

/**
 * Guards every authenticated screen and publishes the signed-in user to the
 * client tree, so AppShell and the sidebar render real identity.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  const branchRow = user.branchId
    ? (
        await db
          .select({ name: branches.name })
          .from(branches)
          .where(eq(branches.id, user.branchId))
          .limit(1)
      )[0]
    : undefined;

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
      {children}
    </SessionProvider>
  );
}
