import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { businesses } from "@/lib/super-admin-data";

export const Route = createFileRoute("/edit-business")({
  validateSearch: z.object({ id: z.number().optional() }),
  head: () => ({
    meta: [
      { title: "Edit Business — Super Admin" },
      { name: "description", content: "Update business name, email and phone number." },
      { property: "og:title", content: "Edit Business — Super Admin" },
      { property: "og:description", content: "Update business name, email and phone number." },
    ],
  }),
  component: EditBusinessPage,
});

function EditBusinessPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const business = businesses.find((b) => b.id === id) ?? businesses[0]!;
  const [form, setForm] = useState({ name: business.name, email: business.adminEmail ?? "", phone: business.phone });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Business updated successfully!");
    navigate({ to: "/manage-business" });
  };

  return (
    <AppShell title="Edit Business" subtitle={`Business #${business.id} · ${business.name}`}>
      <div className="panel min-w-0 max-w-2xl border-l-4 border-l-primary p-6">
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="name">Business Name</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" className="rounded-lg">Save Changes</Button>
            <Button asChild type="button" variant="secondary" className="rounded-lg">
              <Link to="/manage-business">← Back</Link>
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}