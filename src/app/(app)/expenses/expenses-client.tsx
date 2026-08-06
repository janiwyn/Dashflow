"use client";

import type { viewExpenses } from "@/db/queries/views";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/format";


type Expense = Awaited<ReturnType<typeof viewExpenses>>[number];

const columns: Column<Expense>[] = [
  { key: "ref", header: "Ref", render: (e) => <span className="num text-muted-foreground">{e.ref}</span> },
  { key: "label", header: "Description", render: (e) => <span className="font-medium">{e.label}</span> },
  {
    key: "category",
    header: "Category",
    render: (e) => (
      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{e.category}</span>
    ),
  },
  { key: "date", header: "Date", render: (e) => <span className="num text-muted-foreground">{e.date}</span> },
  { key: "amount", header: "Amount", align: "right", render: (e) => <span className="num font-semibold">{currency(e.amount)}</span> },
];

type Props = {
  expenses: Awaited<ReturnType<typeof viewExpenses>>;
};

export default function ExpensesPage({ expenses }: Props) {
  return (
    <AppShell
      title="Expenses"
      subtitle={`${expenses.length} entries · ${currency(expenses.reduce((s, e) => s + e.amount, 0))} recorded`}
      actions={
        <Button size="sm" className="rounded-lg">
          Record expense
        </Button>
      }
    >
      <DataTable title="Expense ledger" columns={columns} rows={expenses} minWidth={640} />
    </AppShell>
  );
}
