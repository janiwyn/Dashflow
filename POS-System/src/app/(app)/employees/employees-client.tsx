"use client";

import { useState, useTransition } from "react";
import { Users, UserPlus, Pencil, Trash2 } from "lucide-react";

import { createEmployee } from "@/app/actions/hr";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useCurrency } from "@/components/currency-provider";
import type { Employee } from "@/db/queries/views";
import type { viewEmployees, viewHrBranches, viewSystemUsers } from "@/db/queries/views";

type Props = {
  branches: Awaited<ReturnType<typeof viewHrBranches>>;
  initialEmployees: Awaited<ReturnType<typeof viewEmployees>>;
  systemUsers: Awaited<ReturnType<typeof viewSystemUsers>>;
};

const columns = (currency: (n: number) => string): Column<Employee>[] => [
  { key: "name", header: "Name", render: (e) => <span className="font-medium">{e.name}</span> },
  { key: "email", header: "Email", render: (e) => <span className="text-muted-foreground">{e.email}</span> },
  { key: "phone", header: "Phone", render: (e) => <span className="num text-muted-foreground">{e.phone}</span> },
  { key: "branch", header: "Branch", render: (e) => e.branch },
  { key: "position", header: "Position", render: (e) => e.position },
  { key: "baseSalary", header: "Base Salary", align: "right", render: (e) => <span className="num font-semibold">{currency(e.baseSalary)}</span> },
  { key: "hireDate", header: "Hire Date", render: (e) => <span className="num text-muted-foreground">{e.hireDate}</span> },
  {
    key: "status", header: "Status",
    render: (e) => (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${e.status === "Active" ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"}`}>
        {e.status}
      </span>
    ),
  },
  {
    key: "actions", header: "", align: "right",
    render: () => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" className="size-8 rounded-lg"><Pencil className="size-3.5" /></Button>
        <Button variant="ghost" size="icon" className="size-8 rounded-lg text-destructive"><Trash2 className="size-3.5" /></Button>
      </div>
    ),
  },
];

type LoginMode = "new" | "existing" | "none";

export default function EmployeesPage({ branches, initialEmployees, systemUsers }: Props) {
  const { format: currency } = useCurrency();
  const employeeColumns = columns(currency);
  const employees = initialEmployees;
  const [open, setOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("new");
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState("");
  const active = employees.filter((e) => e.status === "Active").length;
  const totalPayroll = employees.reduce((s, e) => s + e.baseSalary, 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const login: Parameters<typeof createEmployee>[0]["login"] =
      loginMode === "new"
        ? { mode: "new", password: String(fd.get("password") || ""), role: fd.get("role") === "manager" ? "manager" : "staff" }
        : loginMode === "existing"
          ? { mode: "existing", userId: String(fd.get("user_id") || "") }
          : { mode: "none" };

    startTransition(async () => {
      const result = await createEmployee({
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        position: String(fd.get("position") || ""),
        baseSalary: Number(fd.get("base_salary") || 0),
        hireDate: String(fd.get("hire_date") || ""),
        branchId: fd.get("branch_id") ? Number(fd.get("branch_id")) : null,
        status: fd.get("status") === "Inactive" ? "inactive" : "active",
        login,
      });
      setNotice(result.message);
      if (result.ok) {
        setOpen(false);
        form.reset();
        setLoginMode("new");
      }
    });
  }

  return (
    <AppShell
      title="Employee Management"
      subtitle={`${employees.length} employees across ${branches.length} branches`}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-lg"><UserPlus className="size-4" /> Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} method="post" className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Full Name</Label><Input name="name" required /></div>
                <div className="grid gap-1.5"><Label>Email</Label><Input type="email" name="email" required={loginMode === "new"} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Phone</Label><Input name="phone" /></div>
                <div className="grid gap-1.5">
                  <Label>Branch</Label>
                  <Select name="branch_id" required>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5"><Label>Position</Label><Input name="position" /></div>
                <div className="grid gap-1.5"><Label>Base Salary</Label><Input type="number" name="base_salary" required /></div>
                <div className="grid gap-1.5"><Label>Hire Date</Label><Input type="date" name="hire_date" /></div>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select name="status" defaultValue="Active">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-1 grid gap-1.5 rounded-lg border border-border p-3">
                <Label>System login</Label>
                <Select value={loginMode} onValueChange={(v) => setLoginMode(v as LoginMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Create a login now (recommended)</SelectItem>
                    <SelectItem value="existing">Link an existing login</SelectItem>
                    <SelectItem value="none">No login — this employee won&apos;t sign in</SelectItem>
                  </SelectContent>
                </Select>

                {loginMode === "new" && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      They&apos;ll sign in with the email above and this password — no invite code needed.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label>Password</Label>
                        <Input type="password" name="password" minLength={8} required placeholder="At least 8 characters" />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Role</Label>
                        <Select name="role" defaultValue="staff">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                {loginMode === "existing" && (
                  <Select name="user_id">
                    <SelectTrigger><SelectValue placeholder="Choose an existing login" /></SelectTrigger>
                    <SelectContent>
                      {systemUsers.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.username}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <DialogFooter><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save Employee"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {notice && (
        <div className="rounded-lg bg-accent px-4 py-2.5 text-sm">{notice}</div>
      )}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total employees" value={String(employees.length)} icon={Users} hint={`${active} active`} />
        <StatCard label="Combined base salary" value={currency(totalPayroll)} icon={Users} hint="per month" />
        <StatCard label="Branches" value={String(branches.length)} icon={Users} hint="operating" />
      </section>
      <DataTable title="Employee directory" description="All employees for this business" columns={employeeColumns} rows={employees} minWidth={960} />
      <p className="text-xs text-muted-foreground">
        Looking for a single employee record? Visit <Link href="/employee" className="underline">the employee detail page</Link>.
      </p>
    </AppShell>
  );
}
