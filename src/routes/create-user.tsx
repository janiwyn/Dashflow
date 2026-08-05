import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { branches, userAccounts as initialAccounts, type SystemUserAccount } from "@/lib/hr-data";

export const Route = createFileRoute("/create-user")({
  head: () => ({
    meta: [
      { title: "Create User — Meridian POS" },
      { name: "description", content: "Create a new system user account with role and branch assignment." },
      { property: "og:title", content: "Create User — Meridian POS" },
      { property: "og:description", content: "Create a new system user account with role and branch assignment." },
    ],
  }),
  component: CreateUserPage,
});

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

function CreateUserPage() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [notice, setNotice] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") || "");
    const password = String(fd.get("password") || "");
    const role = String(fd.get("role") || "");
    if (!username || !password || !role) {
      setNotice("Please fill in all required fields.");
      return;
    }
    const branchId = fd.get("branch_id");
    const branchName = branches.find((b) => String(b.id) === branchId)?.name ?? null;
    setAccounts([
      { id: accounts.length + 1, username, role: role as SystemUserAccount["role"], branch: branchName, createdAt: new Date().toISOString().slice(0, 10), status: "Active" },
      ...accounts,
    ]);
    setNotice("User created successfully!");
    e.currentTarget.reset();
  }

  return (
    <AppShell title="Create User" subtitle="Provision a new system account">
      <div className="panel max-w-xl p-6">
        {notice && <div className="mb-4 rounded-lg bg-accent px-4 py-2 text-sm">{notice}</div>}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5"><Label>Username</Label><Input name="username" required /></div>
          <div className="grid gap-1.5"><Label>Password</Label><Input type="password" name="password" required /></div>
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
          <div><Button type="submit" className="rounded-lg"><UserPlus2 className="size-4" /> Create User</Button></div>
        </form>
      </div>
      <DataTable title="System users" description="All provisioned accounts" columns={columns} rows={accounts} />
    </AppShell>
  );
}