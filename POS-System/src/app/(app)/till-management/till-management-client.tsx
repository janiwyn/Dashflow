"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Landmark, PlusCircle, Wallet, Undo2 } from "lucide-react";

import { createTill, recordTillRemoval } from "@/app/actions/tills";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/components/currency-provider";
import type { Till } from "@/db/queries/views";
import type { viewBranchOptions, viewEmployees, viewTillRemovals, viewTills } from "@/db/queries/views";

type Props = {
  branches: Awaited<ReturnType<typeof viewBranchOptions>>;
  employees: Awaited<ReturnType<typeof viewEmployees>>;
  tillRemovals: Awaited<ReturnType<typeof viewTillRemovals>>;
  removalsThisWeek: number;
  tills: Awaited<ReturnType<typeof viewTills>>;
};

export default function TillManagementPage({ branches, employees, tillRemovals, removalsThisWeek, tills }: Props) {
  const { format: currency } = useCurrency();
  const router = useRouter();

  const tillColumns: Column<Till>[] = [
    { key: "created", header: "Date created", render: (t) => <span className="num text-muted-foreground">{t.created}</span> },
    { key: "name", header: "Till", render: (t) => <span className="font-medium">{t.name}</span> },
    { key: "branch", header: "Branch", render: (t) => t.branch },
    { key: "staff", header: "Staff", render: (t) => t.staff },
    { key: "phone", header: "Phone", render: (t) => <span className="num text-muted-foreground">{t.phone}</span> },
    { key: "balance", header: "Balance", align: "right", render: (t) => <span className="num font-semibold">{currency(t.balance)}</span> },
  ];

  // --- Create & Assign Till: previously had no state, no handler, and no server action at all. ---
  const [newName, setNewName] = useState("");
  const [newBranch, setNewBranch] = useState("");
  const [newStaff, setNewStaff] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, startCreating] = useTransition();

  const submitCreate = () => {
    if (!newName.trim()) {
      toast.error("Till name is required.");
      return;
    }
    startCreating(async () => {
      const result = await createTill({
        name: newName,
        branchName: newBranch || undefined,
        staffName: newStaff || undefined,
        phone: newPhone || undefined,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setNewName("");
      setNewBranch("");
      setNewStaff("");
      setNewPhone("");
      router.refresh();
    });
  };

  // --- Remove cash to safe: previously only set local React state, no persistence at all. ---
  const [safeTillId, setSafeTillId] = useState("");
  const [safeAmount, setSafeAmount] = useState("");
  const [removing, startRemoving] = useTransition();

  const submitRemoval = () => {
    const till = tills.find((t) => String(t.id) === safeTillId);
    const amount = Number(safeAmount);
    if (!till || !amount || amount <= 0) {
      toast.error("Please select a till and enter a valid amount.");
      return;
    }
    startRemoving(async () => {
      const result = await recordTillRemoval({ tillId: till.id, amount });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setSafeTillId("");
      setSafeAmount("");
      router.refresh();
    });
  };

  return (
    <AppShell title="Till Management" subtitle="Create tills, assign staff and manage safe removals">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active tills" value={String(tills.length)} icon={Landmark} hint="across branches" />
        <StatCard label="Total balance held" value={currency(tills.reduce((s, t) => s + t.balance, 0))} icon={Wallet} hint="current tills" />
        <StatCard label="Removals this week" value={String(removalsThisWeek)} icon={Undo2} hint="last 7 days" />
      </section>

      <Tabs defaultValue="create" className="panel p-5">
        <TabsList>
          <TabsTrigger value="create">Create & Assign Till</TabsTrigger>
          <TabsTrigger value="manage">Till Management</TabsTrigger>
          <TabsTrigger value="safes">Till Safes</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-5 max-w-2xl space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Till name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Till 05"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Select value={newBranch} onValueChange={setNewBranch}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>{branches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Staff member</Label>
              <Select value={newStaff} onValueChange={setNewStaff}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Phone number</Label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                className="rounded-lg"
              />
            </div>
          </div>
          <Button onClick={submitCreate} disabled={creating} className="rounded-lg">
            <PlusCircle className="mr-2 size-4" /> {creating ? "Creating…" : "Create till"}
          </Button>
        </TabsContent>

        <TabsContent value="manage" className="mt-5">
          <DataTable title="Manage tills" description="All tills across branches" columns={tillColumns} rows={tills} />
        </TabsContent>

        <TabsContent value="safes" className="mt-5 space-y-6">
          <div className="max-w-2xl space-y-4">
            <h3 className="text-sm font-semibold">Remove cash to safe</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Till</Label>
                <Select value={safeTillId} onValueChange={setSafeTillId}>
                  <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select till" /></SelectTrigger>
                  <SelectContent>
                    {tills.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name} · {t.branch} (bal. {currency(t.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input type="number" value={safeAmount} onChange={(e) => setSafeAmount(e.target.value)} placeholder="0.00" className="rounded-lg num" />
              </div>
            </div>
            <Button onClick={submitRemoval} disabled={removing} className="rounded-lg">
              {removing ? "Recording…" : "Record removal"}
            </Button>
          </div>

          <DataTable
            title="Removal history"
            description="Approved till safe removals"
            columns={[
              { key: "till", header: "Till", render: (r: Props["tillRemovals"][number]) => r.till },
              { key: "amount", header: "Amount", align: "right", render: (r) => <span className="num font-medium">{currency(r.amount)}</span> },
              { key: "approvedBy", header: "Approved by", render: (r) => r.approvedBy },
              { key: "balanceAfter", header: "Balance after", align: "right", render: (r) => <span className="num">{currency(r.balanceAfter)}</span> },
              { key: "date", header: "Date", render: (r) => <span className="num text-muted-foreground">{r.date}</span> },
            ]}
            rows={tillRemovals}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
