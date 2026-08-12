"use client";

import type { getTrialBalance } from "@/db/queries/accounting";
import { CheckCircle2, XCircle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCurrency } from "@/components/currency-provider";

type Account = Awaited<ReturnType<typeof getTrialBalance>>["accounts"][number];

type Props = {
  trialBalance: Awaited<ReturnType<typeof getTrialBalance>>;
};

export default function TrialBalancePage({ trialBalance }: Props) {
  const { format: currency } = useCurrency();
  const { accounts, totalDebit, totalCredit } = trialBalance;

  const columns: Column<Account>[] = [
    { key: "account", header: "Account Name", render: (r) => `${r.name} (${r.type})` },
    { key: "debit", header: "Debit (Dr)", align: "right", render: (r) => <span className="num">{currency(r.debit)}</span> },
    { key: "credit", header: "Credit (Cr)", align: "right", render: (r) => <span className="num">{currency(r.credit)}</span> },
  ];

  const balanced = Math.abs(totalDebit - totalCredit) < 1;

  return (
    <AppShell title="Trial Balance" subtitle={`Totals — Dr ${currency(totalDebit)} · Cr ${currency(totalCredit)}`}>
      {accounts.length === 0 ? (
        <div className="panel p-10 text-center text-sm text-muted-foreground">
          No accounts yet — the chart of accounts fills in automatically the first time a sale or
          expense is recorded, or you can add one from{" "}
          <Link href="/add-account" className="text-primary underline">
            Add Account
          </Link>
          .
        </div>
      ) : (
        <>
          <DataTable title="Account balances" columns={columns} rows={accounts} minWidth={560} />

          <section className={`panel flex items-center justify-center gap-2 p-4 text-sm font-semibold ${balanced ? "text-primary" : "text-destructive"}`}>
            {balanced ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
            {balanced ? "Trial Balance is Balanced" : "Trial Balance is NOT Balanced"}
          </section>
        </>
      )}

      <div className="flex justify-end">
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/accounting">← Back to Accounting</Link>
        </Button>
      </div>
    </AppShell>
  );
}
