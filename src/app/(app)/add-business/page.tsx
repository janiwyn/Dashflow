import type { Metadata } from "next";

import AddBusinessPage from "./add-business-client";

export const metadata: Metadata = {
  title: "Add Business \u2014 Super Admin",
  description: "Register a new business tenant on the platform.",
};

export default async function Page() {
  return <AddBusinessPage  />;
}
