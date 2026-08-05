import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/pos-data";
import { accounts } from "@/lib/accounting-data";

export const Route = createFileRoute("/trail-balance")({
  head: () => ({
    meta: [
      { title: "Trial Balance — Meridian POS" },
      { name: "description", content: "Verify that total debits equal total credits across accounts." },
      { property: "og:title", content: "Trial Balance — Meridian POS" },
      { property: "og:description", content: "Verify that total debits equal total credits across accounts." },
    ],
  }),
  component: TrialBalancePage,
});

const rows = [
  { account: "Cash in Hand", debit: 68420, credit: 0 },
  { account: "Bank — Equity Bank", debit: 342600, credit: 0 },
  { account: "Inventory", debit: 891200, credit: 0 },
  { account: "Accounts Payable", debit: 0, credit: 251100 },
  { account: "Sales Revenue", debit: 0, credit: 268400 },
  { account: "Rent Expense", debit: 145000, credit: 0 },
  { account: "Utilities Expense", debit: 23400, credit: 0 },
  { account: "Owner's Equity", debit: 0, credit: 951120 },
];

type Row = (typeof rows)[number];

const columns: Column<Row>[] = [
  { key: "account", header: "Account Name", render: (r) => r.account },
  { key: "debit", header: "Debit (Dr)", align: "right", render: (r) => <span className="num">{currency(r.debit)}</span> },
  { key: "credit", header: "Credit (Cr)", align: "right", render: (r) => <span className="num">{currency(r.credit)}</span> },
];

function TrialBalancePage() {
  const grandDebit = rows.reduce((s, r) => s + r.debit, 0);
  const grandCredit = rows.reduce((s, r) => s + r.credit, 0);
  const balanced = grandDebit === grandCredit;

  return (
    <AppShell title="Trial Balance" subtitle={`Totals — Dr ${currency(grandDebit)} · Cr ${currency(grandCredit)}`}>
      <DataTable title="Account balances" columns={columns} rows={rows} minWidth={560} />

      <section className={`panel flex items-center justify-center gap-2 p-4 text-sm font-semibold ${balanced ? "text-primary" : "text-destructive"}`}>
        {balanced ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
        {balanced ? "Trial Balance is Balanced" : "Trial Balance is NOT Balanced"}
      </section>

      <div className="flex justify-end">
        <Button asChild variant="outline" className="rounded-lg">
          <Link to="/accounting">← Back to Accounting</Link>
        </Button>
      </div>
    </AppShell>
  );
}