"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bluetooth,
  BluetoothConnected,
  Building2,
  CalendarDays,
  Coins,
  CreditCard,
  Mail,
  Printer,
  Save,
  SunMoon,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { updateBusinessSettings } from "@/app/actions/settings";
import { updateOwnProfile } from "@/app/actions/users";
import { AppShell } from "@/components/app-shell";
import { useCurrency } from "@/components/currency-provider";
import { usePrinter } from "@/components/printer-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { currencyMeta, formatMoney } from "@/lib/currency";
import { MODULE_CATALOG, MODULE_TILE_STYLE, modulesMonthlyTotal, type ModuleKey } from "@/lib/modules";
import { annualPrice, isPlanKey, PLAN_CATALOG } from "@/lib/plans";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import type { viewBusinessSettings, viewProfile, viewSubscriptionUsage } from "@/db/queries/views";

type BusinessSettings = NonNullable<Awaited<ReturnType<typeof viewBusinessSettings>>>;
type SubscriptionUsage = Awaited<ReturnType<typeof viewSubscriptionUsage>>;

type Props = {
  currentProfile: NonNullable<Awaited<ReturnType<typeof viewProfile>>>;
  settings: BusinessSettings | null;
  usage: SubscriptionUsage | null;
  isAdmin: boolean;
};

export default function SettingsPage({ currentProfile, settings, usage, isAdmin }: Props) {
  return (
    <AppShell title="Settings" subtitle="Your profile, business details, currency and subscription">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {settings && <TabsTrigger value="business">Business</TabsTrigger>}
          {settings && usage && <TabsTrigger value="subscription">Subscription</TabsTrigger>}
          <TabsTrigger value="printer">Printer</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab currentProfile={currentProfile} />
        </TabsContent>

        {settings && (
          <TabsContent value="business">
            <BusinessTab settings={settings} readOnly={!isAdmin} />
          </TabsContent>
        )}

        {settings && usage && (
          <TabsContent value="subscription">
            <SubscriptionPanel settings={settings} usage={usage} readOnly={!isAdmin} />
          </TabsContent>
        )}

        <TabsContent value="printer">
          <PrinterSettings />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function ProfileTab({ currentProfile }: { currentProfile: Props["currentProfile"] }) {
  const router = useRouter();
  const [name, setName] = useState(currentProfile.name);
  const [phone, setPhone] = useState(currentProfile.phone === "—" ? "" : currentProfile.phone);
  const [pending, startTransition] = useTransition();
  const initials = currentProfile.name.split(" ").map((s) => s[0]).join("").slice(0, 2);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    startTransition(async () => {
      const result = await updateOwnProfile({ name: name.trim(), phone: phone.trim() });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="panel h-fit overflow-hidden">
        <div className="h-20 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent" />
        <div className="-mt-10 px-6 pb-6">
          <Avatar className="size-20 border-4 border-card shadow-card">
            <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <p className="mt-3 truncate text-lg font-semibold tracking-tight">{currentProfile.name}</p>
          <Badge variant="secondary" className="mt-1.5">
            {currentProfile.role}
          </Badge>

          <div className="mt-5 grid gap-3 border-t border-border pt-5 text-sm">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Mail className="size-4 shrink-0" />
              <span className="truncate">{currentProfile.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Building2 className="size-4 shrink-0" />
              <span className="truncate">{currentProfile.branch}</span>
            </div>
            {currentProfile.hireDate && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <CalendarDays className="size-4 shrink-0" />
                <span className="truncate">Member since {currentProfile.hireDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel min-w-0 p-6">
        <div className="mb-5 flex items-center gap-2">
          <UserRound className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Personal information</h2>
        </div>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} name="name" className="rounded-lg" />
          </div>
          <div className="grid gap-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} name="phone" className="rounded-lg" />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Email</Label>
            <Input type="email" defaultValue={currentProfile.email} name="email" disabled className="rounded-lg" />
            <p className="text-xs text-muted-foreground">Email is your sign-in identity and can&apos;t be changed here.</p>
          </div>

          <div className="flex flex-col-reverse items-start gap-3 border-t border-border pt-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">Changes apply to your account only.</p>
            <Button type="submit" disabled={pending} className="rounded-lg">
              <Save className="size-4" /> {pending ? "Saving…" : "Update Profile"}
            </Button>
          </div>
        </form>
      </div>

      <div className="panel min-w-0 p-6 lg:col-span-2">
        <div className="mb-1 flex items-center gap-2">
          <SunMoon className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Appearance</h2>
        </div>
        <p className="text-sm text-muted-foreground">Choose how Dashflow looks on this device.</p>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

function BusinessTab({ settings, readOnly }: { settings: BusinessSettings; readOnly: boolean }) {
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
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
      {readOnly && (
        <p className="lg:col-span-2 text-xs text-muted-foreground">
          Only admins can change business details — you&apos;re viewing this read-only.
        </p>
      )}
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
              disabled={readOnly}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              placeholder="e.g. Quality groceries, every branch"
              disabled={readOnly}
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              disabled={readOnly}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              disabled={readOnly}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="taxPin">Tax PIN</Label>
            <Input
              id="taxPin"
              placeholder="Printed on invoices and receipts"
              disabled={readOnly}
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
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })} disabled={readOnly}>
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

        {!readOnly && (
          <div className="panel min-w-0 p-6">
            <Button type="submit" disabled={pending} className="w-full rounded-lg sm:w-auto">
              <Save className="size-4" />
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number | null }) {
  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="num font-medium">
          {used} {max !== null ? `of ${max}` : "(unlimited)"}
        </span>
      </div>
      {max !== null && (
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-[width] ${pct >= 100 ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${Math.max(pct, used > 0 ? 3 : 0)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function SubscriptionPanel({
  settings,
  usage,
  readOnly,
}: {
  settings: BusinessSettings;
  usage: NonNullable<SubscriptionUsage>;
  readOnly: boolean;
}) {
  const plan = isPlanKey(settings.planKey) ? PLAN_CATALOG[settings.planKey] : null;
  const activeModules = usage.activeModules as ModuleKey[];

  const price = plan
    ? plan.monthlyPrice === null
      ? "Custom pricing"
      : `${formatMoney(settings.billingPeriod === "annual" ? annualPrice(plan.monthlyPrice) : plan.monthlyPrice, settings.currency)}${settings.billingPeriod === "annual" ? "/yr" : "/mo"}`
    : `${formatMoney(modulesMonthlyTotal(activeModules), settings.currency)}/mo`;

  const statusTone =
    settings.subscriptionStatus === "active"
      ? "bg-success/12 text-success"
      : settings.subscriptionStatus === "pending"
        ? "bg-warning/15 text-warning-foreground"
        : "bg-destructive/12 text-destructive";

  return (
    <div className="panel min-w-0 p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CreditCard className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Subscription</h2>
        </div>
        {!readOnly && (
          <Button asChild variant="outline" size="sm" className="rounded-lg">
            <Link href="/subscribe">{plan ? "Change plan" : "Upgrade to a package"}</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold">{plan ? `${plan.label} plan` : "Custom (à la carte modules)"}</p>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusTone}`}>
              {settings.subscriptionStatus}
            </span>
          </div>
          <p className="num mt-1 text-sm text-muted-foreground">{price}</p>
          {plan && <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>}
          {(settings.subscriptionStart || settings.subscriptionEnd) && (
            <p className="mt-2 text-xs text-muted-foreground">
              {settings.subscriptionStart && `Started ${settings.subscriptionStart}`}
              {settings.subscriptionStart && settings.subscriptionEnd && " · "}
              {settings.subscriptionEnd && `Renews ${settings.subscriptionEnd}`}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {activeModules.length === 0 ? (
              <span className="text-xs text-muted-foreground">No modules active.</span>
            ) : (
              activeModules.map((key) => (
                <span
                  key={key}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${MODULE_TILE_STYLE[key]}`}
                >
                  {MODULE_CATALOG[key].label}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Usage</p>
          <UsageBar label="Users" used={usage.userCount} max={plan?.maxUsers ?? null} />
          <UsageBar label="Branches" used={usage.branchCount} max={plan?.maxBranches ?? null} />
          {!plan && (
            <p className="text-xs text-muted-foreground">
              No package selected — usage isn&apos;t capped, and you&apos;re billed per module active above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PrinterSettings() {
  const printer = usePrinter();
  const { code } = useCurrency();
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
        currencySymbol: currencyMeta(code).symbol,
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
    <div className="panel min-w-0 p-6">
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
