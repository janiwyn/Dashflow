import type { Metadata } from "next";

import CreateBranchPage from "./create-branch-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Add Branch",
  description: "Register a new branch under your business.",
};

export default async function Page() {
  // Matches createBranch()'s own check — a manager could otherwise fill out
  // this whole form and only find out it's not allowed when the action
  // silently redirects them away on submit.
  await requireRole("super", "admin");

  return <CreateBranchPage />;
}
