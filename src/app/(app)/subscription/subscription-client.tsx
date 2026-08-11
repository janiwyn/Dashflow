"use client";

import { useMemo, useState, useTransition } from "react";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateBusinessModules } from "@/app/actions/super-admin";
import type { Business } from "@/db/queries/views";
import type { viewBusinesses } from "@/db/queries/views";
import { MODULE_LIST, type ModuleKey } from "@/lib/modules";

type Props = {
  seed: Awaited<ReturnType<typeof viewBusinesses>>;
  modules: Record<number, ModuleKey[]>;
};

function StatusBadge({ status }: { status: Business["subscriptionStatus"] }) {
  const tone =
    status === "active" ? "bg-success/12 text-success" : status === "pending" ? "bg-warning/15 text-warning-foreground" : "bg-destructive/12 text-destructive";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tone}`}>{status}</span>;
}

function ModulesCell({
  business,
  active,
  onSaved,
}: {
  business: Business;
  active: ModuleKey[];
  onSaved: (keys: ModuleKey[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Set<ModuleKey>>(new Set(active));
  const [isPending, startTransition] = useTransition();

  const toggle = (key: ModuleKey, checked: boolean) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const save = () => {
    const keys = Array.from(draft);
    startTransition(async () => {
      const result = await updateBusinessModules(business.id, keys);
      if (result.ok) {
        toast.success(result.message);
        onSaved(keys);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(new Set(active));
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {active.length === 0 ? "No modules" : `${active.length} module${active.length === 1 ? "" : "s"}`}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-md px-2 text-xs"
          onClick={() => setOpen(true)}
        >
          <Settings2 className="size-3.5" /> Manage
        </Button>
      </div>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modules — {business.name}</DialogTitle>
          <DialogDescription>
            Choose which modules this business can access. The sidebar and screens on their account
            update immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {MODULE_LIST.map((m) => (
            <label
              key={m.key}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-accent/40"
            >
              <Checkbox
                checked={draft.has(m.key)}
                onCheckedChange={(checked) => toggle(m.key, checked === true)}
                className="mt-0.5"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{m.label}</span>
                <span className="block text-xs text-muted-foreground">{m.description}</span>
              </span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={isPending}>
            {isPending ? "Saving…" : "Save modules"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SubscriptionPage({ seed, modules }: Props) {
  const [rows, setRows] = useState<Business[]>(seed);
  const [moduleMap, setModuleMap] = useState<Record<number, ModuleKey[]>>(modules);
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
      key: "modules",
      header: "Modules",
      render: (r) => (
        <ModulesCell
          business={r}
          active={moduleMap[r.id] ?? []}
          onSaved={(keys) => setModuleMap((prev) => ({ ...prev, [r.id]: keys }))}
        />
      ),
    },
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
      subtitle="Track subscription periods and manage active modules for every business"
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
      <DataTable title="Subscriptions" description={`${filtered.length} businesses`} columns={columns} rows={filtered} minWidth={1180} />
      <p className="text-xs text-muted-foreground">
        Note: badge preview below reflects current status —{" "}
        {filtered.slice(0, 1).map((b) => (
          <StatusBadge key={b.id} status={b.subscriptionStatus} />
        ))}
      </p>
    </AppShell>
  );
}
