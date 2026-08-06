import type { Metadata } from "next";

import { viewCashBookEntries } from "@/db/queries/views";
import CashBookPage from "./cash-book-client";

export const metadata: Metadata = {
  title: "Cash Book",
  description: "Three-column cash book of receipts and payments.",
};

export default async function Page() {
  const cashBookEntries = await viewCashBookEntries();
  return <CashBookPage cashBookEntries={cashBookEntries} />;
}
