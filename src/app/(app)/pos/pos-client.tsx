"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Search, Trash2, CreditCard, Smartphone, Banknote } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/components/currency-provider";
import type { viewCategories, viewPosProducts } from "@/db/queries/views";

type Props = {
  categories: Awaited<ReturnType<typeof viewCategories>>;
  products: Awaited<ReturnType<typeof viewPosProducts>>;
};

export default function Terminal({ categories, products }: Props) {
  const { format: currency } = useCurrency();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({ "P-1041": 1, "P-1042": 3 });

  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === "All" || p.category === category) &&
          p.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [category, query],
  );

  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find((p) => p.id === id)!, qty }))
    .filter((l) => l.product);

  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const tax = Math.round(subtotal * 0.16);

  const bump = (id: string, delta: number) =>
    setCart((c) => {
      const next = (c[id] ?? 0) + delta;
      const { [id]: _removed, ...rest } = c;
      return next <= 0 ? rest : { ...c, [id]: next };
    });

  return (
    <AppShell title="Sales terminal" subtitle="Till 02 · Cashier James K.">
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Scan barcode or search product"
                className="h-11 rounded-xl bg-card pl-9"
              />
            </div>
            <Button variant="outline" className="h-11 shrink-0 rounded-xl">
              Hold sale
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  category === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <button
                key={p.id}
                onClick={() => bump(p.id, 1)}
                className="panel group min-w-0 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold">{p.name}</p>
                  <span
                    className={cn(
                      "num shrink-0 rounded-md px-1.5 py-0.5 text-[0.7rem] font-medium",
                      p.stock <= 12 ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {p.stock}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{p.category}</p>
                <p className="num mt-4 text-lg font-semibold text-foreground">{currency(p.price)}</p>
              </button>
            ))}
          </div>
        </div>

        <aside className="panel flex min-w-0 flex-col self-start p-5 xl:sticky xl:top-24">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate text-base font-semibold">Current sale</h2>
            <span className="num shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {lines.length} items
            </span>
          </div>

          <ul className="mt-4 min-h-[120px] divide-y divide-border">
            {lines.length === 0 && (
              <li className="py-10 text-center text-sm text-muted-foreground">
                Tap a product to start a sale
              </li>
            )}
            {lines.map(({ product, qty }) => (
              <li key={product.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="num truncate text-xs text-muted-foreground">
                    {qty} × {currency(product.price)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon" className="size-7 rounded-md" onClick={() => bump(product.id, -1)}>
                    {qty === 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}
                  </Button>
                  <span className="num w-6 text-center text-sm">{qty}</span>
                  <Button variant="ghost" size="icon" className="size-7 rounded-md" onClick={() => bump(product.id, 1)}>
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <Row label="Subtotal" value={currency(subtotal)} />
            <Row label="VAT (16%)" value={currency(tax)} />
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border pt-3">
              <dt className="truncate font-display text-base font-semibold">Total</dt>
              <dd className="num text-xl font-bold">{currency(subtotal + tax)}</dd>
            </div>
          </dl>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Cash", icon: Banknote },
              { label: "M-Pesa", icon: Smartphone },
              { label: "Card", icon: CreditCard },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-2 py-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <Button className="mt-3 h-12 w-full rounded-xl text-base">Charge {currency(subtotal + tax)}</Button>
        </aside>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <dt className="truncate text-muted-foreground">{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}
