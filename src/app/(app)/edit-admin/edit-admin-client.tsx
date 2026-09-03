"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { updateAdmin } from "@/app/actions/super-admin";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminRow } from "@/db/queries/super-admin";

export default function EditAdminPage({ admin }: { admin: AdminRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    email: admin.email,
    role: admin.role === "manager" ? "manager" : "admin",
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateAdmin({
        id: admin.id,
        email: form.email,
        role: form.role as "admin" | "manager",
      });
      if (result.ok) {
        toast.success(result.message);
        router.push("/manage-admin");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <AppShell title="Edit Admin" subtitle={`${admin.name} · ${admin.businessName ?? "—"}`}>
      <div className="panel min-w-0 max-w-xl p-6">
        <form onSubmit={onSubmit} method="post" className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
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
            <Button type="submit" disabled={pending} className="rounded-lg">
              {pending ? "Saving…" : "Save Changes"}
            </Button>
            <Button asChild type="button" variant="secondary" className="rounded-lg">
              <Link href="/manage-admin">← Back</Link>
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
