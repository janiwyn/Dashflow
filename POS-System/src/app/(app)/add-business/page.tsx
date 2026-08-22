import type { Metadata } from "next";

import AddBusinessPage from "./add-business-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Add Business — Super Admin",
  description: "Register a new business tenant on the platform.",
};

export default async function Page() {
  // Previously ungated — reachable, and submittable in principle, by any
  // signed-in account (the form itself was fake at the time, but the guard
  // was still missing).
  await requireRole("super");

  return <AddBusinessPage />;
}
