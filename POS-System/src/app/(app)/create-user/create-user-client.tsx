"use client";

import { useState, useTransition } from "react";
import { UserPlus2 } from "lucide-react";

import { createUserAccount } from "@/app/actions/users";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SystemUserAccount } from "@/db/queries/views";
import type { viewHrBranches, viewUserAccounts } from "@/db/queries/views";

type Props = {
  branches: Awaited<ReturnType<typeof viewHrBranches>>;
  initialAccounts: Awaited<ReturnType<typeof viewUserAccounts>>;
};

const columns: Column<SystemUserAccount>[] = [
  { key: "username", header: "Username", render: (u) => <span className="font-medium">{u.username}</span> },
  { key: "role", header: "Role", render: (u) => <span className="capitalize">{u.role}</span> },
  { key: "branch", header: "Branch", render: (u) => u.branch ?? "—" },
  { key: "createdAt", header: "Created", render: (u) => <span className="num text-muted-foreground">{u.createdAt}</span> },
  {
    key: "status", header: "Status",
    render: (u) => (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.status === "Active" ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"}`}>{u.status}</span>
    ),
  },
];

export default function CreateUserPage({ branches, initialAccounts }: Props) {
  const accounts = initialAccounts;
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const username = String(fd.get("username") || "");
    const password = String(fd.get("password") || "");
    const role = String(fd.get("role") || "");
    const email = String(fd.get("email") || "");

    if (!username || !password || !role || !email) {
      setNotice("Please fill in all required fields.");
      return;
    }

    const branchId = fd.get("branch_id") ? Number(fd.get("branch_id")) : null;

    startTransition(async () => {
      const result = await createUserAccount({
        name: username,
        email,
        password,
        role: role as "admin" | "manager" | "staff",
        branchId,
      });
      setNotice(result.message);
      if (result.ok) form.reset();
    });
  }

  return (
    <AppShell title="Create User" subtitle="Provision a new system account">
      <div className="panel max-w-xl p-6">
        {notice && <div className="mb-4 rounded-lg bg-accent px-4 py-2 text-sm">{notice}</div>}
        <form onSubmit={handleSubmit} method="post" className="grid gap-4">
          <div className="grid gap-1.5"><Label>Full name</Label><Input name="username" required /></div>
          <div className="grid gap-1.5"><Label>Email</Label><Input type="email" name="email" required /></div>
          <div className="grid gap-1.5"><Label>Password</Label><Input type="password" name="password" minLength={8} required /></div>
          <div className="grid gap-1.5">
            <Label>Role</Label>
            <Select name="role" defaultValue="staff">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Assign to branch</Label>
            <Select name="branch_id">
              <SelectTrigger><SelectValue placeholder="None (Admin)" /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Button type="submit" disabled={pending} className="rounded-lg"><UserPlus2 className="size-4" /> {pending ? "Creating…" : "Create User"}</Button></div>
        </form>
      </div>
      <DataTable title="System users" description="All provisioned accounts" columns={columns} rows={accounts} />
    </AppShell>
  );
}
