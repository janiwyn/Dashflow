import type { Metadata } from "next";

import CreateBranchPage from "./create-branch-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Add Branch",
  description: "Register a new branch under your business.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");

  return <CreateBranchPage  />;
}
