"use client";

import { useState, useTransition } from "react";

import { createLedgerAccount, type LedgerAccountType } from "@/app/actions/accounting";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { viewLedgerAccounts } from "@/db/queries/views";

type Props = {
  seedAccounts: Awaited<ReturnType<typeof viewLedgerAccounts>>;
};

type Account = Props["seedAccounts"][number];

const columns: Column<Account>[] = [
  { key: "id", header: "#", render: (a) => <span className="num text-muted-foreground">{a.id}</span> },
  { key: "name", header: "Account Name", render: (a) => <span className="font-medium">{a.name}</span> },
  { key: "type", header: "Type", render: (a) => <span className="capitalize text-muted-foreground">{a.type}</span> },
];

export default function AddAccountPage({ seedAccounts }: Props) {
  const accounts: Account[] = seedAccounts;
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!name || !type) return;
    startTransition(async () => {
      const result = await createLedgerAccount({
        name,
        type: type as LedgerAccountType,
      });
      setMessage({ kind: result.ok ? "success" : "error", text: result.message });
      if (result.ok) {
        setName("");
        setType("");
      }
    });
  };

  return (
    <AppShell title="Add New Account" subtitle="Chart of accounts">
      {message && (
        <div
          className={`rounded-lg border px-4 py-2.5 text-sm ${
            message.kind === "success"
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="panel p-5">
        <h2 className="mb-4 text-base font-semibold">New account</h2>
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label>Account Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter account name" />
          </div>
          <div className="space-y-1.5">
            <Label>Account Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="liability">Liability</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={submit} disabled={pending} className="rounded-lg">
            {pending ? "Adding…" : "Add Account"}
          </Button>
        </div>
      </section>

      <DataTable title="All accounts" description={`${accounts.length} accounts`} columns={columns} rows={accounts} minWidth={480} />
    </AppShell>
  );
}
