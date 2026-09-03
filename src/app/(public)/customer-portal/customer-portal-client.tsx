"use client";

import { useMemo, useState, useTransition } from "react";
import { ShoppingCart, Plus, Minus, MapPin, Search, CheckCircle2 } from "lucide-react";

import { createRemoteOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";
import { useCurrency } from "@/components/currency-provider";
import type { viewHrBranches, viewStorefrontProducts } from "@/db/queries/views";

type Props = {
  branches: Awaited<ReturnType<typeof viewHrBranches>>;
  storefrontProducts: Awaited<ReturnType<typeof viewStorefrontProducts>>;
};

export default function CustomerPortalPage({ branches, storefrontProducts }: Props) {
  const { format: currency } = useCurrency();
  const [branchId, setBranchId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placedRef, setPlacedRef] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const branchName = branches.find((b) => b.id === branchId)?.name ?? "";

  const products = useMemo(
    () => storefrontProducts.filter((p) => (!branchId || p.branchId === branchId) && p.name.toLowerCase().includes(query.toLowerCase())),
    [branchId, query, storefrontProducts],
  );

  const bump = (id: number, d: number) =>
    setCart((c) => {
      const next = (c[id] ?? 0) + d;
      const { [id]: _, ...rest } = c;
      return next <= 0 ? rest : { ...c, [id]: next };
    });

  const lines = Object.entries(cart).map(([id, qty]) => ({ product: storefrontProducts.find((p) => p.id === Number(id))!, qty }));
  const total = lines.reduce((s, l) => s + l.product.price * l.qty, 0);

  const submitOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      branchId,
      customerName: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      deliveryLocation: String(fd.get("location") || ""),
      paymentMethod: String(fd.get("payment_method") || "cash") as "cash" | "mtn_merchant" | "airtel_merchant",
      items: lines.map((l) => ({ productId: l.product.id, quantity: l.qty })),
    };

    startTransition(async () => {
      const result = await createRemoteOrder(input);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setCheckoutOpen(false);
      setPlacedRef(result.reference ?? null);
      setCart({});
    });
  };

  if (placedRef) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-3 size-10 text-success" />
          <h1 className="text-lg font-semibold">Order placed!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your order reference is
          </p>
          <p className="num mt-2 text-2xl font-bold text-primary">{placedRef}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Save this reference to track your order or show it at pickup.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href={`/track-order?ref=${placedRef}`}>
              <Button className="w-full rounded-lg">Track this order</Button>
            </Link>
            <Button variant="outline" className="w-full rounded-lg" onClick={() => setPlacedRef(null)}>
              Place another order
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-display text-lg font-semibold">Dashflow Retail</p>
            <p className="text-xs text-muted-foreground">Order your favourite products online</p>
          </div>
          <Link href="/track-order" className="text-sm font-medium text-primary hover:underline">
            Track an order
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {!branchId ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <MapPin className="mx-auto mb-3 size-8 text-primary" />
            <h1 className="text-lg font-semibold">Select your branch</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose the branch you'd like to pick up your order from.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {branches.map((b) => (
                <button key={b.id} onClick={() => setBranchId(b.id)} className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-primary hover:text-primary">
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Available products — {branchName}</h2>
                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setBranchId(null)}>Change branch</Button>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" className="rounded-xl bg-card pl-9" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.branch}</p>
                    <p className="num mt-2 text-lg font-bold text-primary">{currency(p.price)}</p>
                    <p className="mt-1 text-xs">
                      {p.stock > 0 ? (
                        <span className="rounded-full bg-success/12 px-2 py-0.5 text-success">In stock ({p.stock})</span>
                      ) : (
                        <span className="rounded-full bg-destructive/12 px-2 py-0.5 text-destructive">Out of stock</span>
                      )}
                    </p>
                    <Button size="sm" className="mt-3 w-full rounded-lg" onClick={() => bump(p.id, 1)} disabled={p.stock === 0}>
                      Add to cart
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-6">
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-4" />
                <h3 className="text-sm font-semibold">Your cart</h3>
              </div>
              <ul className="mt-4 min-h-[80px] divide-y divide-border">
                {lines.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">Cart is empty</li>}
                {lines.map(({ product, qty }) => (
                  <li key={product.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="num text-xs text-muted-foreground">{qty} × {currency(product.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => bump(product.id, -1)}><Minus className="size-3.5" /></Button>
                      <span className="num w-5 text-center text-sm">{qty}</span>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => bump(product.id, 1)}><Plus className="size-3.5" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
                <span>Total</span>
                <span className="num">{currency(total)}</span>
              </div>
              <Button className="mt-4 w-full rounded-lg" disabled={lines.length === 0} onClick={() => setCheckoutOpen(true)}>
                Proceed to checkout
              </Button>
            </aside>
          </div>
        )}
      </main>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete your order</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitOrder} method="post" className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Your name</Label>
              <Input name="name" required />
            </div>
            <div className="grid gap-1.5">
              <Label>Phone number</Label>
              <Input name="phone" placeholder="0772 345 678" required />
            </div>
            <div className="grid gap-1.5">
              <Label>Delivery / pickup location</Label>
              <Input name="location" placeholder="e.g. Nakasero, Kampala" />
            </div>
            <div className="grid gap-1.5">
              <Label>How will you pay?</Label>
              <Select name="payment_method" defaultValue="cash">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash on pickup/delivery</SelectItem>
                  <SelectItem value="mtn_merchant">MTN Mobile Money</SelectItem>
                  <SelectItem value="airtel_merchant">Airtel Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm font-semibold">
              <span>Order total</span>
              <span className="num">{currency(total)}</span>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending} className="w-full rounded-lg">
                {pending ? "Placing order…" : "Place order"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
