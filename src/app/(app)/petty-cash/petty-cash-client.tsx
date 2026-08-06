"use client";

import { useState } from "react";
import { Plus, Minus, Wallet } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { currency } from "@/lib/format";
import type { viewBranchSummaries, viewPettyCash } from "@/db/queries/views";

type Props = {
  branches: Awaited<ReturnType<typeof viewBranchSummaries>>;
  pettyCashBalanceActions: Awaited<ReturnType<typeof viewPettyCash>>["actions"];
  pettyCashTransactions: Awaited<ReturnType<typeof viewPettyCash>>["transactions"];
};

type Action = Props["pettyCashBalanceActions"][number];
type Txn = Props["pettyCashTransactions"][number];

const actionColumns: Column<Action>[] = [
  { key: "date", header: "Date & Time", render: (r) => <span className="num text-muted-foreground">{r.date}</span> },
  {
    key: "action",
    header: "Action",
    render: (r) => (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.action === "add" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
        {r.action === "add" ? "Add" : "Remove"}
      </span>
    ),
  },
  { key: "amount", header: "Amount", align: "right", render: (r) => <span className="num font-semibold">{currency(r.amount)}</span> },
  { key: "approvedBy", header: "Approved By", render: (r) => r.approvedBy },
];

const txnColumns: Column<Txn>[] = [
  { key: "date", header: "Date", render: (r) => <span className="num text-muted-foreground">{r.date}</span> },
  { key: "name", header: "Name", render: (r) => r.name },
  { key: "branch", header: "Branch", render: (r) => <span className="text-muted-foreground">{r.branch}</span> },
  { key: "purpose", header: "Purpose", render: (r) => <span className="capitalize">{r.purpose}</span> },
  { key: "reason", header: "Reason", render: (r) => r.reason },
  { key: "amount", header: "Amount", align: "right", render: (r) => <span className="num font-semibold">{currency(r.amount)}</span> },
  {
    key: "balance",
    header: "Balance",
    align: "right",
    render: (r) => <span className={`num ${r.balance > 0 ? "text-destructive" : "text-muted-foreground"}`}>{currency(r.balance)}</span>,
  },
  { key: "approvedBy", header: "Approved By", render: (r) => r.approvedBy },
];

export default function PettyCashPage({ branches, pettyCashBalanceActions, pettyCashTransactions }: Props) {
  const totalAdd = pettyCashBalanceActions.filter((a) => a.action === "add").reduce((s, a) => s + a.amount, 0);
  const totalRemove = pettyCashBalanceActions.filter((a) => a.action === "remove").reduce((s, a) => s + a.amount, 0);
  const balance = totalAdd - totalRemove;
  const [tab, setTab] = useState("balance");

  return (
    <AppShell
      title="Petty Cash Management"
      subtitle={`${branches.length} branches tracked`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg">
            <Plus className="size-4" /> Add
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg">
            <Minus className="size-4" /> Remove
          </Button>
        </div>
      }
    >
      <section className="panel flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <Wallet className="size-6 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Account Balance</p>
            <p className="text-2xl font-bold">{currency(balance)}</p>
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="balance">Petty Cash</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="balance" className="mt-4">
          <DataTable title="Balance actions" columns={actionColumns} rows={pettyCashBalanceActions} minWidth={560} />
        </TabsContent>
        <TabsContent value="transactions" className="mt-4">
          <DataTable title="Petty cash transactions" columns={txnColumns} rows={pettyCashTransactions} minWidth={840} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
