"use client";

import { CheckCircle2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { currency } from "@/lib/format";


const assets = [
  { label: "Cash", value: 68420 },
  { label: "Bank", value: 342600 },
  { label: "Inventory", value: 891200 },
];
const liabilities = [{ label: "Accounts Payable", value: 251100 }];
const equity = [{ label: "Retained Earnings", value: 1051120 }];

function Section({ title, rows, accent }: { title: string; rows: { label: string; value: number }[]; accent: string }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <div className="panel flex flex-col">
      <div className={`border-b border-border px-4 py-3 text-center text-sm font-semibold ${accent}`}>{title}</div>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="px-4 py-2.5">{r.label}</td>
              <td className="px-4 py-2.5 text-right num">{currency(r.value)}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="px-4 py-2.5">Total {title}</td>
            <td className="px-4 py-2.5 text-right num">{currency(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function BalanceSheetPage() {

  const totalAssets = assets.reduce((s, r) => s + r.value, 0);
  const totalLiab = liabilities.reduce((s, r) => s + r.value, 0);
  const totalEquity = equity.reduce((s, r) => s + r.value, 0);
  const balanced = Math.abs(totalAssets - (totalLiab + totalEquity)) < 1;

  return (
    <AppShell title="Balance Sheet" subtitle="As at 5 August 2026">
      <section className="grid gap-4 lg:grid-cols-3">
        <Section title="Assets" rows={assets} accent="text-primary" />
        <Section title="Liabilities" rows={liabilities} accent="text-destructive" />
        <Section title="Owner's Equity" rows={equity} accent="text-foreground" />
      </section>

      <section className="panel p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Total Assets: <span className="font-semibold text-foreground">{currency(totalAssets)}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Total Liabilities + Equity: <span className="font-semibold text-foreground">{currency(totalLiab + totalEquity)}</span>
        </p>
        <p className={`mt-3 flex items-center justify-center gap-2 text-lg font-bold ${balanced ? "text-primary" : "text-destructive"}`}>
          <CheckCircle2 className="size-5" /> {balanced ? "Balanced" : "Not Balanced"}
        </p>
      </section>

      <div className="flex justify-end">
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/accounting">← Back to Accounting</Link>
        </Button>
      </div>
    </AppShell>
  );
}
