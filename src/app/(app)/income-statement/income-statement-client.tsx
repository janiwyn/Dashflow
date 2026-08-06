"use client";

import type { viewExpenses, viewSales } from "@/db/queries/views";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { currency } from "@/lib/format";


type Props = {
  sales: Awaited<ReturnType<typeof viewSales>>;
  expenses: Awaited<ReturnType<typeof viewExpenses>>;
};

export default function IncomeStatementPage({ sales, expenses }: Props) {
  const totalIncome = sales.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expenses.reduce((s, r) => s + r.amount, 0);
  const net = totalIncome - totalExpense;
  return (
    <AppShell title="Income Statement" subtitle="Profit & Loss">
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel border-l-4 border-l-primary p-5">
          <h2 className="mb-3 text-base font-semibold">Income (Sales)</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground">
                <th className="pb-2 text-left">Sale Description</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="py-2">Invoice #{s.id}</td>
                  <td className="py-2 text-right num">{currency(s.amount)}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-2">Total Income</td>
                <td className="py-2 text-right num">{currency(totalIncome)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="panel border-l-4 border-l-destructive p-5">
          <h2 className="mb-3 text-base font-semibold">Expenses</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground">
                <th className="pb-2 text-left">Expense Description</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((e) => (
                <tr key={e.ref}>
                  <td className="py-2">{e.category} - {e.label}</td>
                  <td className="py-2 text-right num">{currency(e.amount)}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-2">Total Expenses</td>
                <td className="py-2 text-right num">{currency(totalExpense)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel p-6 text-center">
        <p className="text-sm text-muted-foreground">Net Result</p>
        <p className={`mt-2 text-2xl font-bold ${net >= 0 ? "text-primary" : "text-destructive"}`}>
          {net > 0 ? `Net Profit: ${currency(net)}` : net < 0 ? `Net Loss: ${currency(Math.abs(net))}` : "Balanced — No Profit, No Loss"}
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
