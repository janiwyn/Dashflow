"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Hourglass, Package, Settings2, ShieldAlert, Timer, Wallet } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
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
import { setBusinessPlan, updateBusinessModules, updateSubscription } from "@/app/actions/super-admin";
import type { Business } from "@/db/queries/views";
import type { viewBusinesses } from "@/db/queries/views";
import { formatMoney } from "@/lib/currency";
import { MODULE_CATALOG, MODULE_LIST, MODULE_TILE_STYLE, modulesMonthlyTotal, type ModuleKey } from "@/lib/modules";
import { annualPrice, isPlanKey, PLAN_LIST, type PlanKey } from "@/lib/plans";

type Props = {
  seed: Awaited<ReturnType<typeof viewBusinesses>>;
  modules: Record<number, ModuleKey[]>;
};

const PLAN_BADGE_STYLE: Record<PlanKey, string> = {
  starter: "bg-muted text-muted-foreground",
  retail: "bg-primary/12 text-primary",
  business: "bg-violet-50 text-violet-600",
  professional: "bg-amber-50 text-amber-700",
  enterprise: "bg-rose-50 text-rose-600",
};

/** Real monthly cost for a business — the package's flat price if it's on one (à la carte otherwise). Enterprise has no fixed price, so it's excluded (null) rather than guessing at what a negotiated deal actually charges. */
function businessMonthlyCost(business: Business, modules: ModuleKey[]): number | null {
  if (isPlanKey(business.planKey)) {
    const plan = PLAN_LIST.find((p) => p.key === business.planKey)!;
    if (plan.monthlyPrice === null) return null;
    return business.billingPeriod === "annual" ? Math.round(annualPrice(plan.monthlyPrice) / 12) : plan.monthlyPrice;
  }
  return modulesMonthlyTotal(modules);
}

function StatusBadge({ status }: { status: Business["subscriptionStatus"] }) {
  const tone =
    status === "active" || status === "trialing"
      ? "bg-success/12 text-success"
      : status === "pending"
        ? "bg-warning/15 text-warning-foreground"
        : "bg-destructive/12 text-destructive";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tone}`}>{status}</span>;
}

/** The colourful per-module pill used across the marketing site and checkout — reused here so the modules a business actually pays for are visible at a glance instead of hidden behind a count. */
function ModuleBadge({ moduleKey }: { moduleKey: ModuleKey }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${MODULE_TILE_STYLE[moduleKey]}`}
    >
      {MODULE_CATALOG[moduleKey].label}
    </span>
  );
}

function PlanCell({ business, onSaved }: { business: Business; onSaved: (planKey: string | null, billingPeriod: "monthly" | "annual") => void }) {
  const [open, setOpen] = useState(false);
  const [draftPlan, setDraftPlan] = useState<string>(business.planKey ?? "none");
  const [draftBilling, setDraftBilling] = useState<"monthly" | "annual">(business.billingPeriod);
  const [isPending, startTransition] = useTransition();

  const plan = isPlanKey(business.planKey) ? PLAN_LIST.find((p) => p.key === business.planKey) : undefined;

  const save = () => {
    const key = draftPlan === "none" ? null : draftPlan;
    if (key && !isPlanKey(key)) return;
    startTransition(async () => {
      const result = await setBusinessPlan(business.id, key as PlanKey | null, draftBilling);
      if (result.ok) {
        toast.success(result.message);
        onSaved(key, draftBilling);
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
        if (next) {
          setDraftPlan(business.planKey ?? "none");
          setDraftBilling(business.billingPeriod);
        }
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80"
      >
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 ${plan ? PLAN_BADGE_STYLE[plan.key] : "bg-secondary text-secondary-foreground"}`}>
          {plan ? plan.label : "À la carte"}
        </span>
        <Settings2 className="size-3 text-muted-foreground" />
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Plan — {business.name}</DialogTitle>
          <DialogDescription>
            Putting a business on a package replaces its active modules with exactly what that
            package includes. Moving it back to à la carte leaves its modules as-is.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Package</label>
            <Select value={draftPlan} onValueChange={setDraftPlan}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">À la carte (no package)</SelectItem>
                {PLAN_LIST.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    {p.label} {p.monthlyPrice !== null ? `— ${formatMoney(p.monthlyPrice, "UGX")}/mo` : "— custom"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {draftPlan !== "none" && (
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Billing period</label>
              <Select value={draftBilling} onValueChange={(v) => setDraftBilling(v as "monthly" | "annual")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual — 2 months free</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={isPending}>
            {isPending ? "Saving…" : "Save plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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

  const shown = active.slice(0, 3);
  const overflow = active.length - shown.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(new Set(active));
      }}
    >
      <div className="flex max-w-[280px] flex-wrap items-center gap-1.5">
        {active.length === 0 ? (
          <span className="text-xs text-muted-foreground">No modules subscribed</span>
        ) : (
          <>
            {shown.map((key) => (
              <ModuleBadge key={key} moduleKey={key} />
            ))}
            {overflow > 0 && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                +{overflow} more
              </span>
            )}
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 rounded-md px-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(true)}
        >
          <Settings2 className="size-3.5" />
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
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="num shrink-0 text-xs text-muted-foreground">{formatMoney(m.monthlyPrice, "UGX")}/mo</span>
                </span>
                <span className="block text-xs text-muted-foreground">{m.description}</span>
              </span>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Total for {business.name}</span>
          <span className="num font-semibold">{formatMoney(modulesMonthlyTotal(Array.from(draft)), "UGX")}/mo</span>
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
  const router = useRouter();
  const [rows, setRows] = useState<Business[]>(seed);
  const [moduleMap, setModuleMap] = useState<Record<number, ModuleKey[]>>(modules);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      rows.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          (b.adminEmail ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [rows, search],
  );

  const stats = useMemo(() => {
    let active = 0;
    let trialing = 0;
    let pending = 0;
    let expired = 0;
    let packaged = 0;
    let mrr = 0;
    for (const b of rows) {
      if (b.subscriptionStatus === "active") active += 1;
      else if (b.subscriptionStatus === "trialing") trialing += 1;
      else if (b.subscriptionStatus === "pending") pending += 1;
      else expired += 1;
      if (isPlanKey(b.planKey)) packaged += 1;
      mrr += businessMonthlyCost(b, moduleMap[b.id] ?? []) ?? 0;
    }
    return { active, trialing, pending, expired, packaged, aLaCarte: rows.length - packaged, mrr };
  }, [rows, moduleMap]);

  const update = (id: number, patch: Partial<Business>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  // The Start/End date pickers and Status dropdown above only ever touched
  // local state — this "Update" button called nothing but a toast. Now it
  // persists whatever's currently in those three fields for the row.
  const save = (b: Business) => {
    setSavingId(b.id);
    const start = b.subscriptionStart === "—" ? null : b.subscriptionStart;
    const end = b.subscriptionEnd === "—" ? null : b.subscriptionEnd;
    updateSubscription({ id: b.id, start, end, status: b.subscriptionStatus })
      .then((result) => {
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success(result.message);
        router.refresh();
      })
      .finally(() => setSavingId(null));
  };

  const columns: Column<Business>[] = [
    {
      key: "name",
      header: "Business",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.name}</p>
          <p className="truncate text-xs text-muted-foreground">{r.adminEmail ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      render: (r) => (
        <PlanCell
          business={r}
          onSaved={(planKey, billingPeriod) => {
            update(r.id, { planKey, billingPeriod });
            router.refresh();
          }}
        />
      ),
    },
    {
      key: "modules",
      header: "Subscribed modules",
      render: (r) => (
        <ModulesCell
          business={r}
          active={moduleMap[r.id] ?? []}
          onSaved={(keys) => setModuleMap((prev) => ({ ...prev, [r.id]: keys }))}
        />
      ),
    },
    {
      key: "mrr",
      header: "Monthly cost",
      render: (r) => {
        const cost = businessMonthlyCost(r, moduleMap[r.id] ?? []);
        return <span className="num font-medium">{cost === null ? "Custom" : formatMoney(cost, "UGX")}</span>;
      },
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
            <SelectItem value="trialing">Trialing</SelectItem>
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
        <Button size="sm" className="h-8 rounded-md" disabled={savingId === r.id} onClick={() => save(r)}>
          {savingId === r.id ? "Saving…" : "Update"}
        </Button>
      ),
    },
  ];

  return (
    <AppShell
      title="Business Subscriptions"
      subtitle="Track subscription periods and manage packages and modules for every business"
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
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Active Subscriptions" value={String(stats.active)} icon={CreditCard} hint="paying and current" />
        <StatCard label="On Trial" value={String(stats.trialing)} icon={Hourglass} hint="14-day free trial" />
        <StatCard label="Pending" value={String(stats.pending)} icon={Timer} hint="not yet activated" />
        <StatCard label="Expired" value={String(stats.expired)} icon={ShieldAlert} hint="needs renewal" />
        <StatCard label="On a Package" value={String(stats.packaged)} icon={Package} hint={`${stats.aLaCarte} à la carte`} />
        <StatCard label="Total MRR" value={formatMoney(stats.mrr, "UGX")} icon={Wallet} hint="excludes custom Enterprise deals" />
      </section>

      <DataTable title="Subscriptions" description={`${filtered.length} businesses`} columns={columns} rows={filtered} minWidth={1480} />
    </AppShell>
  );
}
