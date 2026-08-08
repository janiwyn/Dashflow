"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Business } from "@/db/queries/views";
import type { viewBusinesses } from "@/db/queries/views";

type Props = {
  seed: Awaited<ReturnType<typeof viewBusinesses>>;
};

function StatusBadge({ status }: { status: Business["subscriptionStatus"] }) {
  const tone =
    status === "active" ? "bg-success/12 text-success" : status === "pending" ? "bg-warning/15 text-warning-foreground" : "bg-destructive/12 text-destructive";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tone}`}>{status}</span>;
}

export default function SubscriptionPage({ seed }: Props) {
  const [rows, setRows] = useState<Business[]>(seed);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      rows.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          (b.adminEmail ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [rows, search],
  );

  const update = (id: number, patch: Partial<Business>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const save = (b: Business) => toast.success(`Subscription updated for ${b.name}`);

  const columns: Column<Business>[] = [
    { key: "name", header: "Business Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "email", header: "Email", render: (r) => r.adminEmail ?? <em className="text-muted-foreground">—</em> },
    {
      key: "start",
      header: "Subscription Start",
      render: (r) => (
        <Input
          type="date"
          className="h-8 w-36 text-xs"
          value={r.subscriptionStart}
          onChange={(e) => update(r.id, { subscriptionStart: e.target.value })}
        />
      ),
    },
    {
      key: "end",
      header: "Subscription End",
      render: (r) => (
        <Input
          type="date"
          className="h-8 w-36 text-xs"
          value={r.subscriptionEnd}
          onChange={(e) => update(r.id, { subscriptionEnd: e.target.value })}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Select value={r.subscriptionStatus} onValueChange={(v) => update(r.id, { subscriptionStatus: v as Business["subscriptionStatus"] })}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <Button size="sm" className="h-8 rounded-md" onClick={() => save(r)}>
          Update
        </Button>
      ),
    },
  ];

  return (
    <AppShell
      title="Business Subscriptions"
      subtitle="Track and manage subscription periods for every business"
      actions={
        <div className="w-64">
          <Input
            placeholder="Search by business or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg"
          />
        </div>
      }
    >
      <DataTable title="Subscriptions" description={`${filtered.length} businesses`} columns={columns} rows={filtered} minWidth={980} />
      <p className="text-xs text-muted-foreground">
        Note: badge preview below reflects current status —{" "}
        {filtered.slice(0, 1).map((b) => (
          <StatusBadge key={b.id} status={b.subscriptionStatus} />
        ))}
      </p>
    </AppShell>
  );
}
