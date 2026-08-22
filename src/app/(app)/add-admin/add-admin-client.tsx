"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createAdminForBusiness } from "@/app/actions/super-admin";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { viewBusinesses } from "@/db/queries/views";

type Props = {
  businesses: Awaited<ReturnType<typeof viewBusinesses>>;
};

export default function AddAdminPage({ businesses }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", businessId: "" });
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!form.businessId) {
      toast.error("Choose which business this admin belongs to.");
      return;
    }
    startTransition(async () => {
      const result = await createAdminForBusiness({
        businessId: Number(form.businessId),
        name: form.username,
        email: form.email,
        password: form.password,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push("/manage-admin");
      router.refresh();
    });
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
            <Button type="submit" disabled={pending} className="rounded-lg">{pending ? "Adding…" : "Add Admin"}</Button>
            <Button asChild type="button" variant="secondary" className="rounded-lg">
              <Link href="/manage-admin">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
