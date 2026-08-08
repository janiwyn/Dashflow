"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Save, Building2, Coins } from "lucide-react";
import { toast } from "sonner";

import { updateBusinessSettings } from "@/app/actions/settings";
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
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import type { viewBusinessSettings } from "@/db/queries/views";

type Props = {
  settings: NonNullable<Awaited<ReturnType<typeof viewBusinessSettings>>>;
};

export default function SettingsPage({ settings }: Props) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: settings.name,
    tagline: settings.tagline,
    phone: settings.phone,
    address: settings.address,
    taxPin: settings.taxPin,
    currency: settings.currency,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateBusinessSettings(form);
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <AppShell title="Settings" subtitle="Business profile, contact details and currency">
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
        <div className="panel min-w-0 p-6">
          <div className="mb-5 flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Business profile</h2>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Business name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="e.g. Quality groceries, every branch"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
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
            <div className="grid gap-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="taxPin">Tax PIN</Label>
              <Input
                id="taxPin"
                placeholder="Printed on invoices and receipts"
                value={form.taxPin}
                onChange={(e) => setForm({ ...form, taxPin: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="panel min-w-0 p-6">
            <div className="mb-5 flex items-center gap-2">
              <Coins className="size-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Currency</h2>
            </div>
            <div className="grid gap-1.5">
              <Label>Display currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} — {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Every amount across the dashboard, receipts and reports switches to this currency
                once saved.
              </p>
            </div>
          </div>

          <div className="panel min-w-0 p-6">
            <Button type="submit" disabled={pending} className="w-full rounded-lg sm:w-auto">
              <Save className="size-4" />
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
