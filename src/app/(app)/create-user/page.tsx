import type { Metadata } from "next";

import { viewHrBranches, viewUserAccounts } from "@/db/queries/views";
import CreateUserPage from "./create-user-client";

export const metadata: Metadata = {
  title: "Create User",
  description: "Create a new system user account with role and branch assignment.",
};

export default async function Page() {
  const [branches, initialAccounts] = await Promise.all([viewHrBranches(), viewUserAccounts()]);
  return <CreateUserPage branches={branches} initialAccounts={initialAccounts} />;
}
