"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { updateBusiness } from "@/app/actions/super-admin";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessRow } from "@/db/queries/super-admin";

export default function EditBusinessPage({ business }: { business: BusinessRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: business.name,
    email: business.adminEmail ?? "",
    phone: business.phone ?? "",
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateBusiness({
        id: business.id,
        name: form.name,
        adminEmail: form.email,
        phone: form.phone,
      });
      if (result.ok) {
        toast.success(result.message);
        router.push("/manage-business");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <AppShell title="Edit Business" subtitle={`Business #${business.id} · ${business.name}`}>
      <div className="panel min-w-0 max-w-2xl border-l-4 border-l-primary p-6">
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="name">Business Name</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={pending} className="rounded-lg">
              {pending ? "Saving…" : "Save Changes"}
            </Button>
            <Button asChild type="button" variant="secondary" className="rounded-lg">
              <Link href="/manage-business">← Back</Link>
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
