import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currency } from "@/lib/pos-data";
import { accounts, ledgerEntries } from "@/lib/accounting-data";

export const Route = createFileRoute("/ledger")({
  head: () => ({
    meta: [
      { title: "Ledger — Meridian POS" },
      { name: "description", content: "View detailed debit and credit entries per account." },
      { property: "og:title", content: "Ledger — Meridian POS" },
      { property: "og:description", content: "View detailed debit and credit entries per account." },
    ],
  }),
  component: LedgerPage,
});

type Entry = { date: string; description: string; debit: number; credit: number };


function LedgerPage() {
  const [accountId, setAccountId] = useState<string>("");
  const account = accounts.find((a) => String(a.id) === accountId);
  const entries = accountId ? ledgerEntries[Number(accountId)] ?? [] : [];

  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
  const balance = totalDebit - totalCredit;

  const cols: Column<Entry>[] = [
    { key: "date", header: "Date", render: (e) => <span className="num text-muted-foreground">{e.date}</span> },
    { key: "description", header: "Description", render: (e) => e.description },
    { key: "debit", header: "Debit", align: "right", render: (e) => <span className="num">{e.debit ? currency(e.debit) : ""}</span> },
    { key: "credit", header: "Credit", align: "right", render: (e) => <span className="num">{e.credit ? currency(e.credit) : ""}</span> },
  ];

  return (
    <AppShell title="Account Ledger" subtitle="Select an account to view its transaction history">
      <section className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-xs space-y-1.5">
          <label className="text-sm text-muted-foreground">Account</label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.name} ({a.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {account && (
          <div className="text-sm text-muted-foreground">
            Balance: <span className="font-semibold text-foreground">{currency(Math.abs(balance))} {balance >= 0 ? "Dr" : "Cr"}</span>
          </div>
        )}
      </section>

      {account ? (
        <DataTable
          title={`Ledger for: ${account.name}`}
          description={`Totals — Debit ${currency(totalDebit)} · Credit ${currency(totalCredit)}`}
          columns={cols}
          rows={entries}
          minWidth={640}
        />
      ) : (
        <div className="panel p-8 text-center text-sm text-muted-foreground">Select an account above to view its ledger.</div>
      )}
    </AppShell>
  );
}