import type { Metadata } from "next";

import { viewCashBookEntries } from "@/db/queries/views";
import AddCashEntryPage from "./add-cash-entry-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Add Cash Entry",
  description: "Record a manual cash or bank receipt/payment entry.",
};

export default async function Page() {
  await requireModule("accounting");
  const seedEntries = await viewCashBookEntries();
  return <AddCashEntryPage seedEntries={seedEntries} />;
}
