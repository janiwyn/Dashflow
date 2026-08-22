import type { Metadata } from "next";

import { getUserAccounts } from "@/db/queries/hr";
import { requireRole } from "@/lib/session";

import ResetPasswordPage from "./reset-password-client";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset a system user's password to the default and notify them.",
};

export default async function Page() {
  const actor = await requireRole("super", "admin");
  // A super account resets across the whole platform (its own action,
  // resetUserPassword, already allows this) — an admin still only sees
  // their own business's users.
  const accounts = await getUserAccounts({ allBusinesses: actor.role === "super" });

  return (
    <ResetPasswordPage
      showBusiness={actor.role === "super"}
      accounts={accounts.map((a) => ({
        id: a.id,
        username: a.username ?? a.email,
        role: a.role,
        branch: a.branch,
        business: a.business,
        status: a.status,
      }))}
    />
  );
}
