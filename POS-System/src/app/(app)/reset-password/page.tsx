import type { Metadata } from "next";

import { getUserAccounts } from "@/db/queries/hr";
import { requireRole } from "@/lib/session";

import ResetPasswordPage from "./reset-password-client";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset a system user's password to the default and notify them.",
};

export default async function Page() {
  await requireRole("super", "admin");
  const accounts = await getUserAccounts();

  return (
    <ResetPasswordPage
      accounts={accounts.map((a) => ({
        id: a.id,
        username: a.username ?? a.email,
        role: a.role,
        branch: a.branch,
        status: a.status,
      }))}
    />
  );
}
