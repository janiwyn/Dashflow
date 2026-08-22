"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, MapPin, ShieldCheck, ShieldX, UsersRound } from "lucide-react";

import { setUserStatus } from "@/app/actions/users";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Business, TeamMember } from "@/db/queries/views";
import type { viewBusinesses, viewBusinessTeamMembers } from "@/db/queries/views";

type Props = {
  businesses: Awaited<ReturnType<typeof viewBusinesses>>;
  members: Awaited<ReturnType<typeof viewBusinessTeamMembers>>;
};

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function RoleBadge({ role }: { role: string }) {
  const tone =
    role === "admin"
      ? "bg-primary/12 text-primary"
      : role === "manager"
        ? "bg-accent text-accent-foreground"
        : "bg-muted text-muted-foreground";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tone}`}>{role}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"
      }`}
    >
      {active ? <ShieldCheck className="size-3" /> : <ShieldX className="size-3" />}
      {active ? "Active" : "Suspended"}
    </span>
  );
}

function PersonRow({ member, onToggled }: { member: TeamMember; onToggled: (id: string, status: string) => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = member.status === "active" ? "suspended" : "active";
    startTransition(async () => {
      const result = await setUserStatus(member.id, next);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      onToggled(member.id, next);
      toast.success(result.message);
      router.refresh();
    });
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] items-center gap-3 px-5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      </div>
      <RoleBadge role={member.role} />
      <span className="hidden text-xs text-muted-foreground sm:inline">{member.branch ?? "—"}</span>
      <StatusBadge status={member.status} />
      <div className="flex items-center gap-1.5">
        {(member.role === "admin" || member.role === "manager") && (
          <Button asChild size="sm" variant="outline" className="h-7 rounded-md px-2 text-xs">
            <Link href={`/edit-admin?id=${member.id}`}>Edit</Link>
          </Button>
        )}
        <Button size="sm" variant="secondary" className="h-7 rounded-md px-2 text-xs" disabled={pending} onClick={toggle}>
          {member.status === "active" ? "Suspend" : "Activate"}
        </Button>
      </div>
    </div>
  );
}

function BusinessGroup({
  business,
  members,
  forceOpen,
  expanded,
  onToggleOpen,
  onMemberToggled,
}: {
  business: Business;
  members: TeamMember[];
  forceOpen: boolean;
  expanded: boolean;
  onToggleOpen: (id: number, open: boolean) => void;
  onMemberToggled: (id: string, status: string) => void;
}) {
  const admins = members.filter((m) => m.role === "admin").length;
  const managers = members.filter((m) => m.role === "manager").length;
  const staff = members.filter((m) => m.role === "staff").length;
  const open = forceOpen || expanded;

  return (
    <details
      className="group panel min-w-0 overflow-hidden"
      open={open}
      onToggle={(e) => onToggleOpen(business.id, e.currentTarget.open)}
    >
      <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {initialsFor(business.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{business.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" /> {business.address}
            </p>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <span className="rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">{admins} admin{admins === 1 ? "" : "s"}</span>
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{managers} manager{managers === 1 ? "" : "s"}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{staff} staff</span>
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" style={{ transform: open ? "rotate(180deg)" : undefined }} />
      </summary>
      <div className="border-t border-border">
        {members.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted-foreground">No team members yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {members.map((m) => (
              <PersonRow key={m.id} member={m} onToggled={onMemberToggled} />
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

export default function ManageAdminPage({ businesses, members: seedMembers }: Props) {
  const [members, setMembers] = useState<TeamMember[]>(seedMembers);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const byBusiness = useMemo(() => {
    const map = new Map<number, TeamMember[]>();
    for (const m of members) {
      if (m.businessId == null) continue;
      const list = map.get(m.businessId) ?? [];
      list.push(m);
      map.set(m.businessId, list);
    }
    return map;
  }, [members]);

  const stats = useMemo(() => {
    const admins = members.filter((m) => m.role === "admin").length;
    const managers = members.filter((m) => m.role === "manager").length;
    const staff = members.filter((m) => m.role === "staff").length;
    return { total: members.length, admins, managers, staff };
  }, [members]);

  const q = search.trim().toLowerCase();
  const visibleBusinesses = useMemo(() => {
    if (!q) return businesses;
    return businesses.filter((b) => {
      if (b.name.toLowerCase().includes(q)) return true;
      return (byBusiness.get(b.id) ?? []).some(
        (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
      );
    });
  }, [businesses, byBusiness, q]);

  const handleMemberToggled = (id: string, status: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  };

  const handleToggleOpen = (id: number, open: boolean) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <AppShell
      title="Business Teams"
      subtitle="Every admin, manager and staff account, grouped by business"
      actions={
        <div className="w-64">
          <Input
            placeholder="Search people or businesses"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg"
          />
        </div>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total People" value={String(stats.total)} icon={UsersRound} hint="across all businesses" />
        <StatCard label="Admins" value={String(stats.admins)} icon={ShieldCheck} hint="business owners" />
        <StatCard label="Managers" value={String(stats.managers)} icon={UsersRound} hint="branch managers" />
        <StatCard label="Staff" value={String(stats.staff)} icon={UsersRound} hint="frontline accounts" />
      </section>

      <div className="flex flex-col gap-3">
        {visibleBusinesses.length === 0 ? (
          <p className="panel px-5 py-8 text-center text-sm text-muted-foreground">No businesses or people match your search.</p>
        ) : (
          visibleBusinesses.map((b) => (
            <BusinessGroup
              key={b.id}
              business={b}
              members={byBusiness.get(b.id) ?? []}
              forceOpen={q.length > 0}
              expanded={expanded.has(b.id)}
              onToggleOpen={handleToggleOpen}
              onMemberToggled={handleMemberToggled}
            />
          ))
        )}
      </div>
    </AppShell>
  );
}
