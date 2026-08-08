"use client";

import { useMemo, useState } from "react";
import { ShoppingCart, Plus, Minus, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useCurrency } from "@/components/currency-provider";
import type { viewBranchOptions, viewStorefrontProducts } from "@/db/queries/views";

type Props = {
  branches: Awaited<ReturnType<typeof viewBranchOptions>>;
  storefrontProducts: Awaited<ReturnType<typeof viewStorefrontProducts>>;
};

export default function CustomerPortalPage({ branches, storefrontProducts }: Props) {
  const { format: currency } = useCurrency();
  const [branch, setBranch] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});

  const products = useMemo(
    () => storefrontProducts.filter((p) => (!branch || p.branch === branch) && p.name.toLowerCase().includes(query.toLowerCase())),
    [branch, query],
  );

  const bump = (id: number, d: number) =>
    setCart((c) => {
      const next = (c[id] ?? 0) + d;
      const { [id]: _, ...rest } = c;
      return next <= 0 ? rest : { ...c, [id]: next };
    });

  const lines = Object.entries(cart).map(([id, qty]) => ({ product: storefrontProducts.find((p) => p.id === Number(id))!, qty }));
  const total = lines.reduce((s, l) => s + l.product.price * l.qty, 0);

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
        {!branch ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <MapPin className="mx-auto mb-3 size-8 text-primary" />
            <h1 className="text-lg font-semibold">Select your branch</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose the branch you'd like to pick up your order from.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {branches.map((b) => (
                <button key={b} onClick={() => setBranch(b)} className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-primary hover:text-primary">
                  {b}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Available products — {branch}</h2>
                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setBranch(null)}>Change branch</Button>
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
              <Button className="mt-4 w-full rounded-lg" disabled={lines.length === 0}>Proceed to checkout</Button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
