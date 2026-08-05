import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { businesses } from "@/lib/super-admin-data";

export const Route = createFileRoute("/add-admin")({
  head: () => ({
    meta: [
      { title: "Add Admin — Super Admin" },
      { name: "description", content: "Create a new business admin account for a tenant business." },
      { property: "og:title", content: "Add Admin — Super Admin" },
      { property: "og:description", content: "Create a new business admin account for a tenant business." },
    ],
  }),
  component: AddAdminPage,
});

function AddAdminPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", businessId: "" });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Admin account added successfully!");
    navigate({ to: "/manage-admin" });
  };

  return (
    <AppShell title="Add New Admin" subtitle="Create a new business admin account">
      <div className="panel min-w-0 max-w-xl border-l-4 border-l-primary p-6">
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="username">Admin Name <span className="text-destructive">*</span></Label>
            <Input id="username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
            <Input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Business</Label>
            <Select value={form.businessId} onValueChange={(v) => setForm({ ...form, businessId: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select business" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="rounded-lg">Add Admin</Button>
            <Button asChild type="button" variant="secondary" className="rounded-lg">
              <Link to="/manage-admin">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}