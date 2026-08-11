"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Bluetooth, BluetoothConnected, Save, Building2, Coins, Printer } from "lucide-react";
import { toast } from "sonner";

import { updateBusinessSettings } from "@/app/actions/settings";
import { AppShell } from "@/components/app-shell";
import { usePrinter } from "@/components/printer-provider";
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

      <PrinterSettings />
    </AppShell>
  );
}

function PrinterSettings() {
  const printer = usePrinter();
  const [testing, setTesting] = useState(false);

  const onTestPrint = async () => {
    setTesting(true);
    try {
      await printer.printReceipt({
        businessName: "Dashflow POS",
        tagline: "Test receipt",
        reference: "TEST-0001",
        date: new Date().toLocaleString(),
        cashier: "Settings",
        items: [
          { name: "Sample item", qty: 1, unitPrice: 100, lineTotal: 100 },
          { name: "Second item", qty: 2, unitPrice: 250, lineTotal: 500 },
        ],
        subtotal: 600,
        total: 600,
        currencySymbol: "KSh",
        footer: "Printer connected successfully",
      });
      toast.success("Test receipt sent to the printer.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not print.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="panel mt-6 min-w-0 p-6">
      <div className="mb-5 flex items-center gap-2">
        <Printer className="size-4 text-muted-foreground" />
        <h2 className="text-base font-semibold">Receipt printer</h2>
      </div>

      {!printer.supported ? (
        <p className="text-sm text-muted-foreground">
          Bluetooth printing isn&apos;t supported in this browser. Use Chrome or Edge on desktop or
          Android to connect a printer.
        </p>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-lg ${
                printer.status === "connected" ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"
              }`}
            >
              {printer.status === "connected" ? (
                <BluetoothConnected className="size-5" />
              ) : (
                <Bluetooth className="size-5" />
              )}
            </span>
            <div>
              <p className="text-sm font-medium">
                {printer.status === "connected"
                  ? printer.deviceName
                  : printer.status === "connecting"
                    ? "Connecting…"
                    : "No printer connected"}
              </p>
              <p className="text-xs text-muted-foreground">
                {printer.status === "connected"
                  ? "Ready to print receipts over Bluetooth."
                  : "Pair a Bluetooth thermal receipt printer to print straight from the till."}
              </p>
              {printer.error && <p className="mt-1 text-xs text-destructive">{printer.error}</p>}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            {printer.status === "connected" ? (
              <>
                <Button variant="outline" size="sm" className="rounded-lg" onClick={onTestPrint} disabled={testing}>
                  {testing ? "Printing…" : "Print test receipt"}
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg" onClick={printer.disconnect}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="rounded-lg"
                onClick={printer.connect}
                disabled={printer.status === "connecting"}
              >
                <Bluetooth className="size-4" /> Connect Bluetooth printer
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
