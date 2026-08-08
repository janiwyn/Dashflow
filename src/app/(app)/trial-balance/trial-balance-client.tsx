"use client";

import type { viewLedgerAccounts } from "@/db/queries/views";
import { CheckCircle2, XCircle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCurrency } from "@/components/currency-provider";


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

type Props = {
  accounts: Awaited<ReturnType<typeof viewLedgerAccounts>>;
};

export default function TrialBalancePage({ accounts }: Props) {
  const { format: currency } = useCurrency();

  const columns: Column<Row>[] = [
    { key: "account", header: "Account Name", render: (r) => r.account },
    { key: "debit", header: "Debit (Dr)", align: "right", render: (r) => <span className="num">{currency(r.debit)}</span> },
    { key: "credit", header: "Credit (Cr)", align: "right", render: (r) => <span className="num">{currency(r.credit)}</span> },
  ];

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
          <Link href="/accounting">← Back to Accounting</Link>
        </Button>
      </div>
    </AppShell>
  );
}
