import type { Metadata } from "next";

import { viewHrBranches, viewUserAccounts } from "@/db/queries/views";
import CreateUserPage from "./create-user-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create User",
  description: "Create a new system user account with role and branch assignment.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");

  const [branches, initialAccounts] = await Promise.all([viewHrBranches(), viewUserAccounts()]);
  return <CreateUserPage branches={branches} initialAccounts={initialAccounts} />;
}
