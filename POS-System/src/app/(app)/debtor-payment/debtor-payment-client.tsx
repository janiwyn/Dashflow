"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Clock3, HandCoins, Plus, Trash2 } from "lucide-react";

import { createDebtor, deleteDebtor, fetchDebtorPayments, recordDebtorPayment } from "@/app/actions/debtors";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCurrency } from "@/components/currency-provider";
import type { getDebtorPayments } from "@/db/queries/operations";
import type { viewDebtors, viewHrBranches } from "@/db/queries/views";

type Debtor = Awaited<ReturnType<typeof viewDebtors>>[number];

type Props = {
  debtors: Awaited<ReturnType<typeof viewDebtors>>;
  branches: Awaited<ReturnType<typeof viewHrBranches>>;
};

export default function DebtorPaymentPage({ debtors, branches }: Props) {
  const { format: currency } = useCurrency();
  const router = useRouter();
  const [branchFilter, setBranchFilter] = useState("all");
  const [payTarget, setPayTarget] = useState<Debtor | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Debtor | null>(null);
  const [pending, startTransition] = useTransition();

  const branchNames = useMemo(() => ["all", ...Array.from(new Set(debtors.map((d) => d.branch)))], [debtors]);
  const filtered = useMemo(
    () => (branchFilter === "all" ? debtors : debtors.filter((d) => d.branch === branchFilter)),
    [debtors, branchFilter],
  );

  const totalOwed = filtered.reduce((s, d) => s + d.balance, 0);

  const remove = (debtor: Debtor) => {
    if (!confirm(`Remove ${debtor.name}'s debtor record? This can't be undone.`)) return;
    startTransition(async () => {
      const result = await deleteDebtor(debtor.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
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
      header: "",
      align: "right",
      render: (d) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => setHistoryTarget(d)}>
            <Clock3 className="size-3.5" />
          </Button>
          <Button size="sm" className="h-8 rounded-lg text-xs" onClick={() => setPayTarget(d)} disabled={d.balance <= 0}>
            <HandCoins className="mr-1 size-3.5" /> Pay
          </Button>
          <Button variant="ghost" size="icon" className="size-8 rounded-lg text-destructive" onClick={() => remove(d)} disabled={pending}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Debtor Payments"
      subtitle="Record repayments against outstanding debtor balances"
      actions={
        <AddDebtorDialog
          branches={branches}
          trigger={
            <Button size="sm" className="rounded-lg">
              <Plus className="size-4" /> Add debtor
            </Button>
          }
          onSaved={() => router.refresh()}
        />
      }
    >
      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Active debtors" value={String(filtered.length)} icon={HandCoins} hint="owing balances" />
        <StatCard label="Total outstanding" value={currency(totalOwed)} icon={HandCoins} hint="across all branches" />
      </section>

      <DataTable
        title="Debtors"
        description="Sorted by balance"
        columns={columns}
        rows={filtered}
        minWidth={860}
        toolbar={
          branchNames.length > 2 ? (
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-9 w-44 rounded-lg text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {branchNames.map((b) => (
                  <SelectItem key={b} value={b}>{b === "all" ? "All branches" : b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />

      <PayDialog debtor={payTarget} onClose={() => setPayTarget(null)} onPaid={() => router.refresh()} />
      <HistoryDialog debtor={historyTarget} onClose={() => setHistoryTarget(null)} />
    </AppShell>
  );
}

/* ---------------------------------------------------------------- Pay */

function PayDialog({ debtor, onClose, onPaid }: { debtor: Debtor | null; onClose: () => void; onPaid: () => void }) {
  const { format: currency } = useCurrency();
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    setAmount("");
    setResult(null);
    onClose();
  };

  const submit = () => {
    if (!debtor) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    startTransition(async () => {
      const res = await recordDebtorPayment({ debtorId: debtor.id, amount: amt });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      setResult(
        res.newBalance && res.newBalance > 0
          ? `Payment recorded. Remaining balance: ${currency(res.newBalance)}`
          : "Debt fully paid off.",
      );
      onPaid();
    });
  };

  return (
    <Dialog open={Boolean(debtor)} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment — {debtor?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>Outstanding balance: <span className="num font-semibold">{debtor && currency(debtor.balance)}</span></p>
          <Input type="number" placeholder="Amount received" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-lg num" disabled={Boolean(result)} />
          {result && (
            <p className="flex items-center gap-2 text-success"><CheckCircle2 className="size-4" /> {result}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close} className="rounded-lg">Close</Button>
          {!result && <Button onClick={submit} disabled={pending} className="rounded-lg">{pending ? "Recording…" : "Record payment"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------- History */

function HistoryDialog({ debtor, onClose }: { debtor: Debtor | null; onClose: () => void }) {
  const { format: currency } = useCurrency();
  const [payments, setPayments] = useState<Awaited<ReturnType<typeof getDebtorPayments>> | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setPayments(null);
      return;
    }
    if (debtor) fetchDebtorPayments(debtor.id).then(setPayments);
  };

  return (
    <Dialog open={Boolean(debtor)} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment history — {debtor?.name}</DialogTitle>
        </DialogHeader>
        {payments === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="text-muted-foreground">{new Date(p.paidAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}</span>
                <span className="num font-medium">{currency(p.amount)}</span>
                <span className="num text-xs text-muted-foreground">bal. {currency(p.balanceAfter)}</span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- Add */

function AddDebtorDialog({
  trigger,
  branches,
  onSaved,
}: {
  trigger: React.ReactNode;
  branches: Awaited<ReturnType<typeof viewHrBranches>>;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      itemTaken: String(fd.get("item_taken") || ""),
      quantity: Number(fd.get("quantity") || 0),
      amountPaid: Number(fd.get("amount_paid") || 0),
      balance: Number(fd.get("balance") || 0),
      branchId: fd.get("branch_id") ? Number(fd.get("branch_id")) : null,
      dueDate: fd.get("due_date") ? String(fd.get("due_date")) : undefined,
    };

    startTransition(async () => {
      const result = await createDebtor(input);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      onSaved();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add debtor</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Name</Label><Input name="name" required /></div>
            <div className="grid gap-1.5"><Label>Phone</Label><Input name="phone" placeholder="0712 345 678" /></div>
          </div>
          <div className="grid gap-1.5">
            <Label>Branch</Label>
            <Select name="branch_id">
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Item taken</Label>
            <Input name="item_taken" placeholder="e.g. Cooking oil, sugar" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5"><Label>Quantity</Label><Input type="number" name="quantity" min={0} defaultValue={1} /></div>
            <div className="grid gap-1.5"><Label>Paid so far</Label><Input type="number" name="amount_paid" min={0} defaultValue={0} /></div>
            <div className="grid gap-1.5"><Label>Balance owed</Label><Input type="number" name="balance" min={0} required /></div>
          </div>
          <div className="grid gap-1.5">
            <Label>Due date (optional)</Label>
            <Input type="date" name="due_date" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="rounded-lg">{pending ? "Saving…" : "Add debtor"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
