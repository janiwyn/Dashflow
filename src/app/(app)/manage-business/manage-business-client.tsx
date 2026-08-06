"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Business } from "@/db/queries/views";
import type { viewBusinesses } from "@/db/queries/views";

type Props = {
  seed: Awaited<ReturnType<typeof viewBusinesses>>;
};

function StatusBadge({ status }: { status: "active" | "suspended" }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        status === "active" ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"
      }`}
    >
      {status === "active" ? "Active" : "Suspended"}
    </span>
  );
}

export default function ManageBusinessPage({ seed }: Props) {
  const [rows, setRows] = useState<Business[]>(seed);

  const toggle = (b: Business) => {
    const next = b.status === "active" ? "suspended" : "active";
    setRows((prev) => prev.map((r) => (r.id === b.id ? { ...r, status: next } : r)));
    toast.success(`Business status updated to ${next}`);
  };

  const columns: Column<Business>[] = [
    { key: "id", header: "ID", render: (r) => <span className="num text-muted-foreground">{r.id}</span> },
    { key: "name", header: "Business Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "admin", header: "Admin Name", render: (r) => r.adminName ?? <em className="text-muted-foreground">No admin yet</em> },
    { key: "email", header: "Email", render: (r) => r.adminEmail ?? <em className="text-muted-foreground">—</em> },
    { key: "phone", header: "Phone", render: (r) => <span className="num text-muted-foreground">{r.phone}</span> },
    { key: "date", header: "Date Registered", render: (r) => <span className="num text-muted-foreground">{r.dateRegistered}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "Action",
      render: (r) => (
        <div className="flex flex-wrap gap-1.5">
          <Button asChild size="sm" variant="outline" className="h-7 rounded-md px-2 text-xs">
            <Link href={`/view-business?id=${r.id}`}>View</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-7 rounded-md px-2 text-xs">
            <Link href={`/edit-business?id=${r.id}`}>Edit</Link>
          </Button>
          <Button size="sm" variant="secondary" className="h-7 rounded-md px-2 text-xs" onClick={() => toggle(r)}>
            {r.status === "active" ? "Suspend" : "Activate"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Manage Businesses"
      subtitle={`${rows.length} businesses registered`}
      actions={
        <Button asChild size="sm" className="rounded-lg">
          <Link href="/add-business">+ Add New Business</Link>
        </Button>
      }
    >
      <DataTable title="Registered businesses" description="All tenants on the platform" columns={columns} rows={rows} minWidth={960} />
    </AppShell>
  );
}
