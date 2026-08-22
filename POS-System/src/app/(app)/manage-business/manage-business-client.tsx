"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, Building2, MapPin, ShieldCheck, ShieldX } from "lucide-react";

import { setBusinessStatus } from "@/app/actions/super-admin";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import type { Business } from "@/db/queries/views";
import type { viewBusinesses } from "@/db/queries/views";

type Props = {
  seed: Awaited<ReturnType<typeof viewBusinesses>>;
};

function StatusBadge({ status }: { status: "active" | "suspended" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        status === "active" ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"
      }`}
    >
      {status === "active" ? <ShieldCheck className="size-3" /> : <ShieldX className="size-3" />}
      {status === "active" ? "Active" : "Suspended"}
    </span>
  );
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function ManageBusinessPage({ seed }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Business[]>(seed);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      rows.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          (b.adminName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (b.adminEmail ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [rows, search],
  );

  const stats = useMemo(() => {
    const active = rows.filter((b) => b.status === "active").length;
    const suspended = rows.length - active;
    const branches = rows.reduce((sum, b) => sum + b.branchCount, 0);
    return { total: rows.length, active, suspended, branches };
  }, [rows]);

  const toggle = (b: Business) => {
    const next = b.status === "active" ? "suspended" : "active";
    startTransition(async () => {
      const result = await setBusinessStatus(b.id, next);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === b.id ? { ...r, status: next } : r)));
      toast.success(result.message);
      router.refresh();
    });
  };

  const columns: Column<Business>[] = [
    {
      key: "name",
      header: "Business",
      render: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {initialsFor(r.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{r.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" /> {r.address}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "admin",
      header: "Admin",
      render: (r) =>
        r.adminName ? (
          <div className="min-w-0">
            <p className="truncate font-medium">{r.adminName}</p>
            <p className="truncate text-xs text-muted-foreground">{r.adminEmail}</p>
          </div>
        ) : (
          <em className="text-xs text-muted-foreground">No admin yet</em>
        ),
    },
    { key: "phone", header: "Phone", render: (r) => <span className="num text-muted-foreground">{r.phone}</span> },
    {
      key: "branches",
      header: "Branches",
      render: (r) => (
        <span className="num inline-flex items-center gap-1.5 text-muted-foreground">
          <Building2 className="size-3.5" /> {r.branchCount}
        </span>
      ),
    },
    { key: "date", header: "Registered", render: (r) => <span className="num text-muted-foreground">{r.dateRegistered}</span> },
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
          <Button size="sm" variant="secondary" className="h-7 rounded-md px-2 text-xs" disabled={pending} onClick={() => toggle(r)}>
            {r.status === "active" ? "Suspend" : "Activate"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Manage Businesses"
      subtitle="Every tenant registered on the platform"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64">
            <Input
              placeholder="Search by business or admin"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg"
            />
          </div>
          <Button asChild size="sm" className="rounded-lg">
            <Link href="/add-business">+ Add New Business</Link>
          </Button>
        </div>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Businesses" value={String(stats.total)} icon={Briefcase} hint="registered tenants" />
        <StatCard label="Active" value={String(stats.active)} icon={ShieldCheck} hint="operating normally" />
        <StatCard label="Suspended" value={String(stats.suspended)} icon={ShieldX} hint="access blocked" />
        <StatCard label="Total Branches" value={String(stats.branches)} icon={Building2} hint="across all businesses" />
      </section>

      <DataTable
        title="Registered businesses"
        description={`${filtered.length} of ${rows.length} businesses`}
        columns={columns}
        rows={filtered}
        minWidth={1080}
      />
    </AppShell>
  );
}
