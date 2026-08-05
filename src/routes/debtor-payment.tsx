import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HandCoins, CheckCircle2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { currency, debtors as debtorsSeed, type Debtor } from "@/lib/sales-ops-data";

export const Route = createFileRoute("/debtor-payment")({
  head: () => ({
    meta: [
      { title: "Debtor Payments — Meridian POS" },
      { name: "description", content: "Record partial or full debtor repayments and automatically reconcile balances." },
      { property: "og:title", content: "Debtor Payments — Meridian POS" },
      { property: "og:description", content: "Record debtor repayments and reconcile balances." },
    ],
  }),
  component: DebtorPaymentPage,
});

function DebtorPaymentPage() {
  const [debtors, setDebtors] = useState<Debtor[]>(debtorsSeed);
  const [active, setActive] = useState<Debtor | null>(null);
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const totalOwed = debtors.reduce((s, d) => s + d.balance, 0);

  const submit = () => {
    if (!active) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setResult("Enter a valid amount.");
      return;
    }
    const newBalance = active.balance - amt;
    if (newBalance > 0) {
      setDebtors((prev) => prev.map((d) => (d.id === active.id ? { ...d, balance: newBalance, amountPaid: d.amountPaid + amt } : d)));
      setResult(`Partial payment recorded. Remaining balance: ${currency(newBalance)}`);
    } else {
      setDebtors((prev) => prev.filter((d) => d.id !== active.id));
      setResult("Debt fully paid and sale recorded.");
    }
  };

  const close = () => {
    setActive(null);
    setAmount("");
    setResult(null);
  };

  const columns: Column<Debtor>[] = [
    { key: "name", header: "Debtor", render: (d) => <span className="font-medium">{d.name}</span> },
    { key: "phone", header: "Phone", render: (d) => <span className="num text-muted-foreground">{d.phone}</span> },
    { key: "itemTaken", header: "Item taken", render: (d) => d.itemTaken },
    { key: "branch", header: "Branch", render: (d) => d.branch },
    { key: "amountPaid", header: "Paid", align: "right", render: (d) => <span className="num">{currency(d.amountPaid)}</span> },
    { key: "balance", header: "Balance", align: "right", render: (d) => <span className="num font-semibold text-destructive">{currency(d.balance)}</span> },
    {
      key: "actions",
      header: "Actions",
      render: (d) => (
        <Button size="sm" className="h-7 rounded-lg text-xs" onClick={() => setActive(d)}>
          <HandCoins className="mr-1 size-3.5" /> Pay
        </Button>
      ),
    },
  ];

  return (
    <AppShell title="Debtor Payments" subtitle="Record repayments against outstanding debtor balances">
      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Active debtors" value={String(debtors.length)} icon={HandCoins} hint="owing balances" />
        <StatCard label="Total outstanding" value={currency(totalOwed)} icon={HandCoins} hint="across all branches" />
      </section>

      <DataTable title="Debtors" description="Sorted by balance" columns={columns} rows={debtors} />

      <Dialog open={!!active} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment — {active?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>Outstanding balance: <span className="num font-semibold">{active && currency(active.balance)}</span></p>
            <Input type="number" placeholder="Amount received" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-lg num" />
            {result && (
              <p className="flex items-center gap-2 text-success"><CheckCircle2 className="size-4" /> {result}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} className="rounded-lg">Close</Button>
            {!result && <Button onClick={submit} className="rounded-lg">Record payment</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}