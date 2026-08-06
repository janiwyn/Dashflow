"use client";

import { useState } from "react";
import { AlertCircle, Bell, Check, Clock, PackageX, Users, X } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { currency } from "@/lib/format";
import type { CustomerDebtorNotif, LowStockNotif, ShopDebtorNotif } from "@/db/queries/views";
import type { viewCustomerDebtorNotifs, viewLowStockNotifs, viewShopDebtorNotifs } from "@/db/queries/views";

type Props = {
  customerDebtorNotifs: Awaited<ReturnType<typeof viewCustomerDebtorNotifs>>;
  lowStockNotifs: Awaited<ReturnType<typeof viewLowStockNotifs>>;
  shopDebtorNotifs: Awaited<ReturnType<typeof viewShopDebtorNotifs>>;
};

function daysOverdue(due: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(due).getTime()) / 86400000));
}

function urgencyClass(days: number) {
  if (days > 7) return "border-destructive/40 bg-destructive/5";
  if (days > 3) return "border-warning/40 bg-warning/5";
  return "border-border bg-muted/30";
}

export default function NotificationsPage({ customerDebtorNotifs, lowStockNotifs, shopDebtorNotifs }: Props) {
  const [shop, setShop] = useState<ShopDebtorNotif[]>(shopDebtorNotifs);
  const [customer, setCustomer] = useState<CustomerDebtorNotif[]>(customerDebtorNotifs);
  const [lowStock, setLowStock] = useState<LowStockNotif[]>(lowStockNotifs);

  const total = shop.length + customer.length + lowStock.length;

  return (
    <AppShell title="Notifications" subtitle={`${total} items need your attention`}>
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Overdue shop debtors" value={String(shop.length)} icon={AlertCircle} hint="pending settlement" />
        <StatCard label="Overdue customers" value={String(customer.length)} icon={Users} hint="pending settlement" />
        <StatCard label="Low stock items" value={String(lowStock.length)} icon={PackageX} hint="below 10 units" />
      </section>

      <section className="panel p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><Bell className="size-4" /> Shop debtors (overdue)</h2>
        {shop.length === 0 && <p className="text-sm text-muted-foreground">No overdue shop debtors.</p>}
        <div className="grid gap-2">
          {shop.map((d) => {
            const days = daysOverdue(d.dueDate);
            return (
              <div key={d.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${urgencyClass(days)}`}>
                <div>
                  <p className="font-medium">{d.name} <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{d.branch}</span></p>
                  <p className="text-sm text-muted-foreground">Due {d.dueDate} · {days} day{days !== 1 ? "s" : ""} overdue · Balance {currency(d.balance)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" className="size-8 rounded-lg" title="Snooze 1 day">
                    <Clock className="size-3.5" />
                  </Button>
                  <Button size="icon" variant="outline" className="size-8 rounded-lg" title="Clear" onClick={() => setShop((p) => p.filter((x) => x.id !== d.id))}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><Users className="size-4" /> Customer debtors (overdue)</h2>
        {customer.length === 0 && <p className="text-sm text-muted-foreground">No overdue customer debtors.</p>}
        <div className="grid gap-2">
          {customer.map((d) => {
            const days = daysOverdue(d.dueDate);
            return (
              <div key={d.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${urgencyClass(days)}`}>
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-sm text-muted-foreground">Due {d.dueDate} · {days} day{days !== 1 ? "s" : ""} overdue · Balance {currency(d.balance)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" className="size-8 rounded-lg" title="Snooze 1 day">
                    <Clock className="size-3.5" />
                  </Button>
                  <Button size="icon" variant="outline" className="size-8 rounded-lg" title="Clear" onClick={() => setCustomer((p) => p.filter((x) => x.id !== d.id))}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><PackageX className="size-4" /> Low stock products</h2>
        {lowStock.length === 0 && <p className="text-sm text-muted-foreground">No low stock alerts.</p>}
        <div className="grid gap-2">
          {lowStock.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3">
              <div>
                <p className="font-medium">{p.name} <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{p.branch}</span></p>
                <p className="text-sm text-muted-foreground">{p.stock} units left · {currency(p.price)}</p>
              </div>
              <Button size="icon" variant="outline" className="size-8 rounded-lg" title="Acknowledge" onClick={() => setLowStock((prev) => prev.filter((x) => x.id !== p.id))}>
                <Check className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
