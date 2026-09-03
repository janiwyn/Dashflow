"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createBusiness } from "@/app/actions/super-admin";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddBusinessPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", adminName: "", email: "", phone: "", address: "" });
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Business name is required");
      return;
    }
    startTransition(async () => {
      const result = await createBusiness({
        name: form.name,
        phone: form.phone,
        address: form.address,
        adminName: form.adminName || undefined,
        adminEmail: form.email || undefined,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message, { duration: 8000 });
      router.push("/manage-business");
      router.refresh();
    });
  };

  return (
    <AppShell title="Add New Business" subtitle="Register a new tenant business on the platform">
      <div className="panel min-w-0 p-6">
        <form onSubmit={onSubmit} method="post" className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="name">Business Name <span className="text-destructive">*</span></Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="admin_name">Admin Name</Label>
            <Input id="admin_name" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <p className="text-xs text-muted-foreground">
              If filled in, this creates the admin login too, with the platform default password — shown once after you submit.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={pending} className="rounded-lg">{pending ? "Adding…" : "Add Business"}</Button>
            <Button asChild type="button" variant="secondary" className="rounded-lg">
              <Link href="/manage-business">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
