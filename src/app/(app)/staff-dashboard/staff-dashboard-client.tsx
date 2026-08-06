"use client";

import { useState } from "react";
import { Banknote, Package, Receipt } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { DataTable } from "@/components/data-table";
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
import { currency } from "@/lib/format";
import type { viewPosProducts, viewStaffStats } from "@/db/queries/views";

type Props = {
  stats: Awaited<ReturnType<typeof viewStaffStats>>;
  products: Awaited<ReturnType<typeof viewPosProducts>>;
};

const mySales = [
  { time: "14:12", product: "Arabica Beans 1kg", quantity: 3, amount: 5550 },
  { time: "13:20", product: "Fresh Milk 500ml", quantity: 6, amount: 390 },
  { time: "11:47", product: "Bar Soap 6pk", quantity: 2, amount: 900 },
  { time: "10:32", product: "Wheat Flour 2kg", quantity: 4, amount: 840 },
];

export default function StaffDashboardPage({ stats, products }: Props) {
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === productId);
    if (!product) {
      setMessage({ text: "Select a product first.", error: true });
      return;
    }
    const qty = Number(quantity);
    if (qty > product.stock) {
      setMessage({ text: "Not enough stock available!", error: true });
      return;
    }
    setMessage({ text: `Recorded sale of ${qty} × ${product.name}.` });
  };

  return (
    <AppShell title="Welcome, Peter Mwangi" subtitle="Staff dashboard · Nairobi — Main branch">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="My sales today" value={currency(stats.revenue)} icon={Banknote} hint={`${stats.receipts} receipts`} />
        <StatCard label="Items sold today" value="15" icon={Package} hint="Across all products" />
        <StatCard label="Receipts issued" value="4" icon={Receipt} hint="Since 07:00" />
      </section>

      <div className="panel min-w-0 p-5">
        <h2 className="text-base font-semibold">Record a sale</h2>
        {message && (
          <div
            className={`mt-3 rounded-lg px-4 py-2.5 text-sm ${
              message.error ? "bg-destructive/12 text-destructive" : "bg-success/12 text-success"
            }`}
          >
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
          <div className="flex flex-col gap-1.5">
            <Label>Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.stock} in stock
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full rounded-lg sm:w-auto">
              Record sale
            </Button>
          </div>
        </form>
      </div>

      <DataTable
        title="My recent sales"
        description="Sales you recorded today"
        columns={[
          { key: "time", header: "Time", render: (r) => <span className="text-muted-foreground">{r.time}</span> },
          { key: "product", header: "Product", render: (r) => r.product },
          { key: "quantity", header: "Qty", align: "right", render: (r) => <span className="num">{r.quantity}</span> },
          { key: "amount", header: "Amount", align: "right", render: (r) => <span className="num font-medium">{currency(r.amount)}</span> },
        ]}
        rows={mySales}
      />
    </AppShell>
  );
}
