import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { admins } from "@/lib/super-admin-data";

export const Route = createFileRoute("/edit-admin")({
  validateSearch: z.object({ id: z.number().optional() }),
  head: () => ({
    meta: [
      { title: "Edit Admin — Super Admin" },
      { name: "description", content: "Update a business admin's email address and role." },
      { property: "og:title", content: "Edit Admin — Super Admin" },
      { property: "og:description", content: "Update a business admin's email address and role." },
    ],
  }),
  component: EditAdminPage,
});

function EditAdminPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const admin = admins.find((a) => a.id === id) ?? admins[0]!;
  const [form, setForm] = useState({ email: admin.email, role: admin.role });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Admin updated successfully!");
    navigate({ to: "/manage-admin" });
  };

  return (
    <AppShell title="Edit Admin" subtitle={`${admin.username} · ${admin.businessName}`}>
      <div className="panel min-w-0 max-w-xl p-6">
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin" | "manager" })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="rounded-lg">Save Changes</Button>
            <Button asChild type="button" variant="secondary" className="rounded-lg">
              <Link to="/manage-admin">← Back</Link>
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}