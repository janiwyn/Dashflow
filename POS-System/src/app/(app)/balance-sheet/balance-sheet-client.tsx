"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import type { getBalanceSheet } from "@/db/queries/accounting";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCurrency } from "@/components/currency-provider";

type Row = { label: string; value: number };

type Props = {
  balanceSheet: Awaited<ReturnType<typeof getBalanceSheet>>;
};

function Section({
  title,
  rows,
  accent,
  currency,
  emptyHint,
}: {
  title: string;
  rows: Row[];
  accent: string;
  currency: (n: number) => string;
  emptyHint: string;
}) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <div className="panel flex flex-col">
      <div className={`border-b border-border px-4 py-3 text-center text-sm font-semibold ${accent}`}>{title}</div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">{emptyHint}</p>
      ) : (
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
      )}
    </div>
  );
}

export default function BalanceSheetPage({ balanceSheet }: Props) {
  const { format: currency } = useCurrency();
  const { assets, liabilities, equity, income, expenseAccounts, totalAssets, totalLiabilities, totalEquity } =
    balanceSheet;

  // Ledger balances are debit-normal: a credit-heavy income account nets
  // negative, a debit-heavy expense account nets positive — so net income
  // (revenue earned so far, minus what's been spent) is the negative of one
  // and the positive of the other, combined into the current period's
  // undistributed profit. Folding it into equity here (as "Retained
  // Earnings") is what makes Assets = Liabilities + Equity actually hold —
  // without it, a business that's only ever made sales would show equity of
  // zero and an unbalanced sheet, even though nothing is wrong.
  const netIncome = -income.reduce((s, r) => s + r.balance, 0) - expenseAccounts.reduce((s, r) => s + r.balance, 0);

  const assetRows: Row[] = assets.map((a) => ({ label: a.name, value: a.balance }));
  const liabilityRows: Row[] = liabilities.map((l) => ({ label: l.name, value: l.balance }));
  const equityRows: Row[] = [
    ...equity.map((e) => ({ label: e.name, value: e.balance })),
    ...(netIncome !== 0 ? [{ label: "Retained Earnings (current)", value: netIncome }] : []),
  ];

  const totalEquityWithEarnings = totalEquity + netIncome;
  const hasAnyAccounts = assets.length + liabilities.length + equity.length + income.length + expenseAccounts.length > 0;
  const balanced = Math.abs(totalAssets - (totalLiabilities + totalEquityWithEarnings)) < 1;

  return (
    <AppShell title="Balance Sheet" subtitle="Updated automatically as sales and expenses happen">
      {!hasAnyAccounts ? (
        <div className="panel p-10 text-center text-sm text-muted-foreground">
          Nothing to show yet — this business hasn&apos;t recorded a sale or expense, so there&apos;s no
          balance sheet to draw. It fills in on its own once they do.
        </div>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <Section title="Assets" rows={assetRows} accent="text-primary" currency={currency} emptyHint="No asset accounts yet." />
            <Section title="Liabilities" rows={liabilityRows} accent="text-destructive" currency={currency} emptyHint="No liabilities recorded." />
            <Section title="Owner's Equity" rows={equityRows} accent="text-foreground" currency={currency} emptyHint="No equity yet." />
          </section>

          <section className="panel p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Total Assets: <span className="font-semibold text-foreground">{currency(totalAssets)}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Total Liabilities + Equity: <span className="font-semibold text-foreground">{currency(totalLiabilities + totalEquityWithEarnings)}</span>
            </p>
            <p className={`mt-3 flex items-center justify-center gap-2 text-lg font-bold ${balanced ? "text-primary" : "text-destructive"}`}>
              {balanced ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
              {balanced ? "Balanced" : "Not Balanced"}
            </p>
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
