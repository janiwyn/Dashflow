import type { Metadata } from "next";

import CreateBranchPage from "./create-branch-client";

export const metadata: Metadata = {
  title: "Add Branch",
  description: "Register a new branch under your business.",
};

export default async function Page() {
  return <CreateBranchPage  />;
}
