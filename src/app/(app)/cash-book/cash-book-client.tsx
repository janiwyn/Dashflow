"use client";

import type { viewCashBookEntries } from "@/db/queries/views";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCurrency } from "@/components/currency-provider";


type Props = {
  cashBookEntries: Awaited<ReturnType<typeof viewCashBookEntries>>;
};

export default function CashBookPage({ cashBookEntries }: Props) {
  const { format: currency } = useCurrency();
  const totals = cashBookEntries.reduce(
    (acc, e) => ({
      cashIn: acc.cashIn + e.cashIn,
      bankIn: acc.bankIn + e.bankIn,
      cashOut: acc.cashOut + e.cashOut,
      bankOut: acc.bankOut + e.bankOut,
    }),
    { cashIn: 0, bankIn: 0, cashOut: 0, bankOut: 0 },
  );
  return (
    <AppShell title="Three-Column Cash Book" subtitle="Receipts and payments by cash and bank">
      <section className="panel overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
              <th rowSpan={2} className="border-b border-border px-4 py-3 text-left">Date</th>
              <th rowSpan={2} className="border-b border-border px-4 py-3 text-left">Particulars</th>
              <th colSpan={2} className="border-b border-border px-4 py-2 text-center">Receipts</th>
              <th colSpan={2} className="border-b border-border px-4 py-2 text-center">Payments</th>
            </tr>
            <tr className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
              <th className="border-b border-border px-4 py-2 text-right">Cash</th>
              <th className="border-b border-border px-4 py-2 text-right">Bank</th>
              <th className="border-b border-border px-4 py-2 text-right">Cash</th>
              <th className="border-b border-border px-4 py-2 text-right">Bank</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cashBookEntries.map((e, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5 num text-muted-foreground">{e.date}</td>
                <td className="px-4 py-2.5">{e.particulars}</td>
                <td className="px-4 py-2.5 text-right num">{e.cashIn ? currency(e.cashIn) : ""}</td>
                <td className="px-4 py-2.5 text-right num">{e.bankIn ? currency(e.bankIn) : ""}</td>
                <td className="px-4 py-2.5 text-right num">{e.cashOut ? currency(e.cashOut) : ""}</td>
                <td className="px-4 py-2.5 text-right num">{e.bankOut ? currency(e.bankOut) : ""}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td colSpan={2} className="px-4 py-2.5 text-right">Totals:</td>
              <td className="px-4 py-2.5 text-right num">{currency(totals.cashIn)}</td>
              <td className="px-4 py-2.5 text-right num">{currency(totals.bankIn)}</td>
              <td className="px-4 py-2.5 text-right num">{currency(totals.cashOut)}</td>
              <td className="px-4 py-2.5 text-right num">{currency(totals.bankOut)}</td>
            </tr>
            <tr className="bg-muted/50 font-semibold">
              <td colSpan={2} className="px-4 py-2.5 text-right">Closing Balance:</td>
              <td colSpan={2} className="px-4 py-2.5 text-right num">Cash: {currency(totals.cashIn - totals.cashOut)}</td>
              <td colSpan={2} className="px-4 py-2.5 text-right num">Bank: {currency(totals.bankIn - totals.bankOut)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div className="flex justify-end">
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/accounting">← Back to Accounting</Link>
        </Button>
      </div>
    </AppShell>
  );
}
