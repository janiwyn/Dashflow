import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, CheckCircle2, Clock, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { currency, trackableOrder } from "@/lib/sales-ops-data";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Meridian Retail" },
      { name: "description", content: "Track the status of your online order using your order reference number." },
      { property: "og:title", content: "Track Your Order — Meridian Retail" },
      { property: "og:description", content: "Track your online order status." },
    ],
  }),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  const [ref, setRef] = useState("");
  const [result, setResult] = useState<typeof trackableOrder | null | "not-found">(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ref.trim().toUpperCase() === trackableOrder.ref) {
      setResult(trackableOrder);
    } else if (ref.trim()) {
      setResult("not-found");
    }
  };

  const steps = [
    { key: "placed", label: "Placed", icon: CheckCircle2 },
    { key: "processing", label: "Processing", icon: Clock },
    { key: "completed", label: "Completed", icon: Package },
  ];

  const stepDone = (key: string) => {
    if (!result || result === "not-found") return false;
    if (key === "placed") return result.status !== "cancelled";
    if (key === "processing") return result.status === "pending" || result.status === "finished";
    if (key === "completed") return result.status === "finished";
    return false;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="font-display text-lg font-semibold">Meridian Retail</p>
          <Link to="/customer-portal" className="text-xs text-primary hover:underline">Back to storefront</Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="flex items-center gap-2 text-base font-semibold">
            <Search className="size-4 text-primary" /> Track your order
          </h1>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <Input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. ORD-2026-10841"
              className="rounded-lg"
            />
            <Button type="submit" className="w-full rounded-lg">Track order</Button>
          </form>

          {result === "not-found" && (
            <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              We couldn't find an order with that reference.
            </p>
          )}

          {result && result !== "not-found" && (
            <div className="mt-6 space-y-5">
              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p className="font-semibold">Order: <span className="num">{result.ref}</span></p>
                <p className="mt-1"><span className="text-muted-foreground">Customer:</span> {result.customer}</p>
                <p><span className="text-muted-foreground">Amount:</span> <span className="num">{currency(result.amount)}</span></p>
                <p className="mt-1">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      result.status === "pending" ? "bg-warning/15 text-warning-foreground" : result.status === "finished" ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
                    )}
                  >
                    {result.status.toUpperCase()}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-between">
                {steps.map((s, i) => (
                  <div key={s.key} className="flex flex-1 flex-col items-center gap-1.5 text-center">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full border-2",
                        stepDone(s.key) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
                      )}
                    >
                      <s.icon className="size-4" />
                    </div>
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                    {i < steps.length - 1 && <span className="sr-only">next</span>}
                  </div>
                ))}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Items</h3>
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {result.items.map((it) => (
                    <li key={it.name} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{it.name} × {it.qty}</span>
                      <span className="num font-medium">{currency(it.subtotal)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}