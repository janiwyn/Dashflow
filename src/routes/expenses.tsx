import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { currency, expenses } from "@/lib/pos-data";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — Meridian POS" },
      { name: "description", content: "Record and review operating expenses by category and branch." },
      { property: "og:title", content: "Expenses — Meridian POS" },
      { property: "og:description", content: "Operating expenses by category and branch." },
    ],
  }),
  component: ExpensesPage,
});

type Expense = (typeof expenses)[number];

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

function ExpensesPage() {
  return (
    <AppShell
      title="Expenses"
      subtitle={`June 2026 · ${currency(251100)} recorded`}
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