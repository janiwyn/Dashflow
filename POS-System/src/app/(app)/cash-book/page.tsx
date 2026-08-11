import type { Metadata } from "next";

import { viewCashBookEntries } from "@/db/queries/views";
import CashBookPage from "./cash-book-client";
import { requireRole } from "@/lib/session";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Cash Book",
  description: "Three-column cash book of receipts and payments.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");
  await requireModule("accounting");

  const cashBookEntries = await viewCashBookEntries();
  return <CashBookPage cashBookEntries={cashBookEntries} />;
}
