"use client";

import { useState } from "react";
import { Save } from "lucide-react";

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
import { useCurrency } from "@/components/currency-provider";
import type { viewStockProducts } from "@/db/queries/views";

type Props = {
  stockProducts: Awaited<ReturnType<typeof viewStockProducts>>;
};

export default function EditProductPage({ stockProducts }: Props) {
  const { code } = useCurrency();
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState({ name: "", buyingPrice: "", sellingPrice: "", stock: "" });
  const [saved, setSaved] = useState(false);

  function pick(id: string) {
    setSelectedId(id);
    setSaved(false);
    const product = stockProducts.find((p) => String(p.id) === id);
    if (product) {
      setForm({
        name: product.name,
        buyingPrice: String(product.buyingPrice),
        sellingPrice: String(product.sellingPrice),
        stock: String(product.stock),
      });
    } else {
      setForm({ name: "", buyingPrice: "", sellingPrice: "", stock: "" });
    }
  }

  return (
    <AppShell title="Edit product" subtitle="Select a product to update its details">
      <section className="panel mx-auto w-full max-w-xl p-6">
        <div className="grid gap-1.5">
          <Label>Select product to edit</Label>
          <Select value={selectedId} onValueChange={pick}>
            <SelectTrigger><SelectValue placeholder="-- Choose a product --" /></SelectTrigger>
            <SelectContent>
              {stockProducts.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedId && (
          <div className="mt-6 grid gap-4">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Buying price ({code})</Label>
                <Input type="number" value={form.buyingPrice} onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Selling price ({code})</Label>
                <Input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Stock</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <Button className="rounded-lg" onClick={() => setSaved(true)}>
              <Save className="size-4" /> Save changes
            </Button>
            {saved && <p className="text-sm text-success">Product updated successfully.</p>}
          </div>
        )}
      </section>
    </AppShell>
  );
}
