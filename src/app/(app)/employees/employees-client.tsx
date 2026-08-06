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
import { currency } from "@/lib/format";
import type { Employee } from "@/db/queries/views";
import type { viewEmployees, viewHrBranches, viewSystemUsers } from "@/db/queries/views";

type Props = {
  branches: Awaited<ReturnType<typeof viewHrBranches>>;
  initialEmployees: Awaited<ReturnType<typeof viewEmployees>>;
  systemUsers: Awaited<ReturnType<typeof viewSystemUsers>>;
};

const columns: Column<Employee>[] = [
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

export default function EmployeesPage({ branches, initialEmployees, systemUsers }: Props) {
  const employees = initialEmployees;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const active = employees.filter((e) => e.status === "Active").length;
  const totalPayroll = employees.reduce((s, e) => s + e.baseSalary, 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    startTransition(async () => {
      await createEmployee({
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        position: String(fd.get("position") || ""),
        baseSalary: Number(fd.get("base_salary") || 0),
        hireDate: String(fd.get("hire_date") || ""),
        branchId: fd.get("branch_id") ? Number(fd.get("branch_id")) : null,
        userId: fd.get("user_id") ? String(fd.get("user_id")) : null,
        status: fd.get("status") === "Inactive" ? "inactive" : "active",
      });
      setOpen(false);
      form.reset();
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
            <DialogHeader><DialogTitle>Add or Update Employee</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>System User (Optional)</Label>
                <Select name="user_id">
                  <SelectTrigger><SelectValue placeholder="Not a system user" /></SelectTrigger>
                  <SelectContent>
                    {systemUsers.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.username}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Full Name</Label><Input name="name" required /></div>
                <div className="grid gap-1.5"><Label>Email</Label><Input type="email" name="email" /></div>
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
              <DialogFooter><Button type="submit">Save Employee</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total employees" value={String(employees.length)} icon={Users} hint={`${active} active`} />
        <StatCard label="Combined base salary" value={currency(totalPayroll)} icon={Users} hint="per month" />
        <StatCard label="Branches" value={String(branches.length)} icon={Users} hint="operating" />
      </section>
      <DataTable title="Employee directory" description="All employees for this business" columns={columns} rows={employees} minWidth={960} />
      <p className="text-xs text-muted-foreground">
        Looking for a single employee record? Visit <Link href="/employee" className="underline">the employee detail page</Link>.
      </p>
    </AppShell>
  );
}
