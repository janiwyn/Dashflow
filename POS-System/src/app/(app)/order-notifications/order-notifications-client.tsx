"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { BellRing, Phone, ScanLine, Store, X } from "lucide-react";

import { cancelRemoteOrder } from "@/app/actions/orders";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { useCurrency } from "@/components/currency-provider";
import type { viewPendingOrders } from "@/db/queries/views";

type Order = Awaited<ReturnType<typeof viewPendingOrders>>[number];

type Props = {
  pendingOrders: Order[];
};

export default function OrderNotificationsPage({ pendingOrders }: Props) {
  const router = useRouter();
  const { format: currency } = useCurrency();
  const [orders, setOrders] = useState<Order[]>(pendingOrders);
  const [cancelling, startCancel] = useTransition();

  const cancel = (reference: string) => {
    setOrders((prev) => prev.filter((o) => o.reference !== reference));
    startCancel(async () => {
      const result = await cancelRemoteOrder(reference);
      if (!result.ok) {
        toast.error(result.message);
        router.refresh();
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const totalValue = orders.reduce((s, o) => s + o.amount, 0);

  return (
    <AppShell title="Order Alerts" subtitle={`${orders.length} remote orders waiting on you`}>
      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Pending orders" value={String(orders.length)} icon={BellRing} hint="awaiting pickup or delivery" />
        <StatCard label="Value pending" value={currency(totalValue)} icon={Store} hint="not yet in the till" />
      </section>

      <section className="panel p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <BellRing className="size-4" /> Remote orders
        </h2>
        {orders.length === 0 && (
          <p className="text-sm text-muted-foreground">No pending remote orders — you&apos;re all caught up.</p>
        )}
        <div className="grid gap-2">
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {o.customer}{" "}
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{o.branch}</span>
                </p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                  <span className="num">{o.reference}</span>
                  <span className="flex items-center gap-1"><Phone className="size-3" /> {o.phone}</span>
                  <span>{o.itemsCount} item{o.itemsCount === 1 ? "" : "s"} · {currency(o.amount)}</span>
                  <span>{o.createdAt}</span>
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" className="rounded-lg" asChild>
                  <Link href={`/qr-scanner?ref=${encodeURIComponent(o.reference)}`}>
                    <ScanLine className="size-3.5" /> Complete
                  </Link>
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-8 rounded-lg text-destructive"
                  title="Cancel order"
                  disabled={cancelling}
                  onClick={() => cancel(o.reference)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
