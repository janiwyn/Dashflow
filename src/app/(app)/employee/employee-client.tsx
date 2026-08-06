"use client";

import { useState } from "react";
import { UserRound, Save, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currency } from "@/lib/format";
import type { Employee } from "@/db/queries/views";
import type { viewEmployees, viewHrBranches, viewSystemUsers } from "@/db/queries/views";

type Props = {
  branches: Awaited<ReturnType<typeof viewHrBranches>>;
  employees: Awaited<ReturnType<typeof viewEmployees>>;
  systemUsers: Awaited<ReturnType<typeof viewSystemUsers>>;
};

const columns: Column<Employee>[] = [
  { key: "name", header: "Name", render: (e) => <span className="font-medium">{e.name}</span> },
  { key: "position", header: "Position", render: (e) => e.position },
  { key: "branch", header: "Branch", render: (e) => e.branch },
  { key: "baseSalary", header: "Base Salary", align: "right", render: (e) => <span className="num">{currency(e.baseSalary)}</span> },
];

export default function EmployeePage({ branches, employees, systemUsers }: Props) {
  const [selectedId, setSelectedId] = useState<number>(employees[0]!.id);
  const selected = employees.find((e) => e.id === selectedId) ?? employees[0]!;

  return (
    <AppShell title="Employee Record" subtitle={`Editing ${selected.name}`}>
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Base salary" value={currency(selected.baseSalary)} icon={UserRound} hint={selected.position} />
        <StatCard label="Branch" value={selected.branch} icon={UserRound} hint={selected.status} />
        <StatCard label="Hired" value={selected.hireDate} icon={UserRound} hint="employment start" />
      </section>

      <div className="panel p-5">
        <h2 className="mb-4 text-base font-semibold">Add or Update Employee</h2>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Select existing record</Label>
            <Select value={String(selectedId)} onValueChange={(v) => setSelectedId(Number(v))}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label>System User (Optional)</Label>
              <Select {...(selected.userId ? { defaultValue: String(selected.userId) } : {})}>
                <SelectTrigger><SelectValue placeholder="Not a system user" /></SelectTrigger>
                <SelectContent>
                  {systemUsers.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.username}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Full Name</Label><Input defaultValue={selected!.name} /></div>
            <div className="grid gap-1.5"><Label>Email</Label><Input defaultValue={selected!.email} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5"><Label>Phone</Label><Input defaultValue={selected!.phone} /></div>
            <div className="grid gap-1.5">
              <Label>Branch</Label>
              <Select defaultValue={String(branches.find((b) => b.name === selected.branch)?.id ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Position</Label><Input defaultValue={selected!.position} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5"><Label>Base Salary</Label><Input type="number" defaultValue={selected!.baseSalary} /></div>
            <div className="grid gap-1.5"><Label>Hire Date</Label><Input type="date" defaultValue={selected!.hireDate} /></div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select defaultValue={selected!.status}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="rounded-lg"><Save className="size-4" /> Save Employee</Button>
            <Button variant="outline" className="rounded-lg text-destructive"><Trash2 className="size-4" /> Delete</Button>
          </div>
        </div>
      </div>

      <DataTable title="All employee records" columns={columns} rows={employees} />
    </AppShell>
  );
}
