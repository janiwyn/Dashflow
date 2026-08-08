"use client";

import { useState } from "react";
import { Landmark, PlusCircle, Wallet, Undo2 } from "lucide-react";

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
import type { viewBranchOptions, viewTillRemovals, viewTills } from "@/db/queries/views";

type Props = {
  branches: Awaited<ReturnType<typeof viewBranchOptions>>;
  tillRemovals: Awaited<ReturnType<typeof viewTillRemovals>>;
  tills: Awaited<ReturnType<typeof viewTills>>;
};

export default function TillManagementPage({ branches, tillRemovals, tills }: Props) {
  const { format: currency } = useCurrency();

  const tillColumns: Column<Till>[] = [
    { key: "created", header: "Date created", render: (t) => <span className="num text-muted-foreground">{t.created}</span> },
    { key: "name", header: "Till", render: (t) => <span className="font-medium">{t.name}</span> },
    { key: "branch", header: "Branch", render: (t) => t.branch },
    { key: "staff", header: "Staff", render: (t) => t.staff },
    { key: "phone", header: "Phone", render: (t) => <span className="num text-muted-foreground">{t.phone}</span> },
    { key: "balance", header: "Balance", align: "right", render: (t) => <span className="num font-semibold">{currency(t.balance)}</span> },
  ];

  const [safeTill, setSafeTill] = useState("");
  const [safeAmount, setSafeAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const submitRemoval = () => {
    if (!safeTill || !safeAmount) {
      setMessage("Please select a till and enter a valid amount.");
      return;
    }
    setMessage("Till removal recorded successfully.");
    setSafeTill("");
    setSafeAmount("");
  };

  return (
    <AppShell title="Till Management" subtitle="Create tills, assign staff and manage safe removals">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active tills" value={String(tills.length)} icon={Landmark} hint="across branches" />
        <StatCard label="Total balance held" value={currency(tills.reduce((s, t) => s + t.balance, 0))} icon={Wallet} hint="current tills" />
        <StatCard label="Removals this week" value={String(tillRemovals.length)} icon={Undo2} hint="approved" />
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
              <Label>Date of creation</Label>
              <Input type="date" className="rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label>Till name</Label>
              <Input placeholder="e.g. Till 05" className="rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Select>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>{branches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Staff member</Label>
              <Select>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>{tills.map((t) => <SelectItem key={t.id} value={t.staff}>{t.staff}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Phone number</Label>
              <Input placeholder="07XX XXX XXX" className="rounded-lg" />
            </div>
          </div>
          <Button className="rounded-lg"><PlusCircle className="mr-2 size-4" /> Create till</Button>
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
                <Select value={safeTill} onValueChange={setSafeTill}>
                  <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select till" /></SelectTrigger>
                  <SelectContent>{tills.map((t) => <SelectItem key={t.id} value={t.name}>{t.name} · {t.branch} (bal. {currency(t.balance)})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input type="number" value={safeAmount} onChange={(e) => setSafeAmount(e.target.value)} placeholder="0.00" className="rounded-lg num" />
              </div>
            </div>
            {message && <p className="text-sm text-success">{message}</p>}
            <Button onClick={submitRemoval} className="rounded-lg">Record removal</Button>
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
