"use client";

import type { viewTransactionsFeed } from "@/db/queries/views";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { currency } from "@/lib/format";


type Row = Awaited<ReturnType<typeof viewTransactionsFeed>>[number];

const columns: Column<Row>[] = [
  { key: "date", header: "Date", render: (r) => <span className="num text-muted-foreground">{r.date}</span> },
  {
    key: "type",
    header: "Type",
    render: (r) => (
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          r.type === "Income" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
        }`}
      >
        {r.type}
      </span>
    ),
  },
  { key: "description", header: "Description", render: (r) => r.description },
  { key: "branch", header: "Branch", render: (r) => <span className="text-muted-foreground">{r.branch}</span> },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    render: (r) => (
      <span className={`num font-semibold ${r.amount < 0 ? "text-destructive" : "text-foreground"}`}>
        {r.amount < 0 ? "-" : ""}
        {currency(Math.abs(r.amount))}
      </span>
    ),
  },
  { key: "handledBy", header: "Handled By", render: (r) => <span className="text-muted-foreground">{r.handledBy}</span> },
];

type Props = {
  transactionsFeed: Awaited<ReturnType<typeof viewTransactionsFeed>>;
};

export default function AddTransactionPage({ transactionsFeed }: Props) {
  const totalIncome = transactionsFeed.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactionsFeed.filter((t) => t.type === "Expense").reduce((s, t) => s + Math.abs(t.amount), 0);
  return (
    <AppShell title="Business Transactions" subtitle="Auto-generated from sales and expenses">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <p className="text-sm text-muted-foreground">Total Income</p>
          <p className="mt-1 text-2xl font-bold text-primary">{currency(totalIncome)}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{currency(totalExpense)}</p>
        </div>
      </section>

      <DataTable title="Transaction feed" description="Newest first" columns={columns} rows={transactionsFeed} minWidth={800} />
    </AppShell>
  );
}
