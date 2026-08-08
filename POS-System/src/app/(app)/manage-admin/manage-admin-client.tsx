"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Admin } from "@/db/queries/views";
import type { viewAdmins } from "@/db/queries/views";

type Props = {
  seed: Awaited<ReturnType<typeof viewAdmins>>;
};

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        status === "active" ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"
      }`}
    >
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}

export default function ManageAdminPage({ seed }: Props) {
  const [rows, setRows] = useState<Admin[]>(seed);

  const toggle = (a: Admin) => {
    const next = a.status === "active" ? "inactive" : "active";
    setRows((prev) => prev.map((r) => (r.id === a.id ? { ...r, status: next } : r)));
    toast.success(`Admin status updated to ${next}`);
  };

  const columns: Column<Admin>[] = [
    { key: "id", header: "ID", render: (r) => <span className="num text-muted-foreground">{r.id}</span> },
    { key: "name", header: "Admin Name", render: (r) => <span className="font-medium">{r.username}</span> },
    { key: "email", header: "Email", render: (r) => r.email },
    { key: "business", header: "Business", render: (r) => r.businessName },
    { key: "role", header: "Role", render: (r) => <span className="capitalize text-muted-foreground">{r.role}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "date", header: "Date Registered", render: (r) => <span className="num text-muted-foreground">{r.createdAt}</span> },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex flex-wrap gap-1.5">
          <Button asChild size="sm" variant="outline" className="h-7 rounded-md px-2 text-xs">
            <Link href={`/edit-admin?id=${r.id}`}>Edit</Link>
          </Button>
          <Button size="sm" variant="secondary" className="h-7 rounded-md px-2 text-xs" onClick={() => toggle(r)}>
            {r.status === "active" ? "Deactivate" : "Activate"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Manage Business Admins"
      subtitle={`${rows.length} admin accounts`}
      actions={
        <Button asChild size="sm" className="rounded-lg">
          <Link href="/add-admin">+ Add New Admin</Link>
        </Button>
      }
    >
      <DataTable title="Business admins" description="All admin-role accounts" columns={columns} rows={rows} minWidth={960} />
    </AppShell>
  );
}
