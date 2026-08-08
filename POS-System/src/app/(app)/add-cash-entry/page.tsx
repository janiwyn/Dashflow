import type { Metadata } from "next";

import { viewCashBookEntries } from "@/db/queries/views";
import AddCashEntryPage from "./add-cash-entry-client";

export const metadata: Metadata = {
  title: "Add Cash Entry",
  description: "Record a manual cash or bank receipt/payment entry.",
};

export default async function Page() {
  const seedEntries = await viewCashBookEntries();
  return <AddCashEntryPage seedEntries={seedEntries} />;
}
