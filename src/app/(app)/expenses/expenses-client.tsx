"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { viewExpenses } from "@/db/queries/views";
import { createExpense } from "@/app/actions/accounting";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/components/currency-provider";

const CATEGORIES = ["Rent", "Utilities", "Logistics", "Payroll", "Supplies", "General"];

type Expense = Awaited<ReturnType<typeof viewExpenses>>[number];

type Props = {
  expenses: Awaited<ReturnType<typeof viewExpenses>>;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function ExpensesPage({ expenses }: Props) {
  const router = useRouter();
  const { format: currency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: "", category: CATEGORIES[0], amount: "", incurredOn: today() });
  const [saving, startSaving] = useTransition();

  const columns: Column<Expense>[] = [
    { key: "ref", header: "Ref", render: (e) => <span className="num text-muted-foreground">{e.ref}</span> },
    { key: "label", header: "Description", render: (e) => <span className="font-medium">{e.label}</span> },
    {
      key: "category",
      header: "Category",
      render: (e) => (
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{e.category}</span>
      ),
    },
    { key: "date", header: "Date", render: (e) => <span className="num text-muted-foreground">{e.date}</span> },
    { key: "amount", header: "Amount", align: "right", render: (e) => <span className="num font-semibold">{currency(e.amount)}</span> },
  ];

  const submit = () => {
    if (!form.label.trim() || !form.amount) return;
    startSaving(async () => {
      const result = await createExpense({
        label: form.label,
        category: form.category,
        amount: Number(form.amount) || 0,
        incurredOn: form.incurredOn,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setForm({ label: "", category: CATEGORIES[0], amount: "", incurredOn: today() });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <AppShell
      title="Expenses"
      subtitle={`${expenses.length} entries · ${currency(expenses.reduce((s, e) => s + e.amount, 0))} recorded`}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-lg">
              Record expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record an expense</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>What was it for?</Label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Branch rent — August"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.incurredOn}
                  onChange={(e) => setForm({ ...form, incurredOn: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The ledger, cash book and financial statements update automatically — nothing else to fill in.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={saving} className="rounded-lg">
                {saving ? "Saving…" : "Save expense"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <DataTable title="Expense ledger" columns={columns} rows={expenses} minWidth={640} />
    </AppShell>
  );
}
