import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Boxes, PackageX, Plus, Trash2, Pencil, Wallet } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { branches, currency, stockProducts, type StockProduct } from "@/lib/stock-data";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — Meridian POS" },
      { name: "description", content: "Add, browse and remove products across every branch." },
      { property: "og:title", content: "Products — Meridian POS" },
      { property: "og:description", content: "Manage the product catalogue across branches." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const [rows, setRows] = useState<StockProduct[]>(stockProducts);
  const [branch, setBranch] = useState("All branches");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", price: "", cost: "", stock: "", branch: "Westlands" });

  const filtered = useMemo(
    () => (branch === "All branches" ? rows : rows.filter((p) => p.branch === branch)),
    [rows, branch],
  );

  const stockValue = filtered.reduce((s, p) => s + p.buyingPrice * p.stock, 0);
  const lowStock = filtered.filter((p) => p.stock < 10).length;

  function addProduct() {
    if (!form.name || !form.price) return;
    setRows((prev) => [
      {
        id: Math.max(...prev.map((p) => p.id)) + 1,
        name: form.name,
        category: form.category || "Uncategorised",
        sellingPrice: Number(form.price) || 0,
        buyingPrice: Number(form.cost) || 0,
        stock: Number(form.stock) || 0,
        branch: form.branch,
      },
      ...prev,
    ]);
    setForm({ name: "", category: "", price: "", cost: "", stock: "", branch: "Westlands" });
    setOpen(false);
  }

  function deleteProduct(id: number) {
    setRows((prev) => prev.filter((p) => p.id !== id));
  }

  const columns: Column<StockProduct>[] = [
    { key: "id", header: "ID", render: (p) => <span className="num text-muted-foreground">P-{p.id}</span> },
    { key: "name", header: "Product", render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "branch", header: "Branch", render: (p) => <span className="text-muted-foreground">{p.branch}</span> },
    {
      key: "stock",
      header: "Stock",
      render: (p) => (
        <span
          className={`num inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            p.stock < 10 ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {p.stock} units
        </span>
      ),
    },
    { key: "cost", header: "Buying price", align: "right", render: (p) => <span className="num">{currency(p.buyingPrice)}</span> },
    { key: "price", header: "Selling price", align: "right", render: (p) => <span className="num font-semibold">{currency(p.sellingPrice)}</span> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (p) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="icon" className="size-8 rounded-lg">
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="size-8 rounded-lg text-destructive" onClick={() => deleteProduct(p.id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Products"
      subtitle={`${filtered.length} products · ${branch}`}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-lg">
              <Plus className="size-4" /> Add product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add product</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Selling price (KES)</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Buying price (KES)</Label>
                  <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Stock</Label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Branch</Label>
                  <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {branches.slice(1).map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addProduct} className="rounded-lg">Save product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Stock value" value={currency(stockValue)} icon={Wallet} hint="at buying price" />
        <StatCard label="Low stock" value={String(lowStock)} icon={PackageX} hint="below 10 units" />
        <StatCard label="Total SKUs" value={String(filtered.length)} icon={Boxes} hint={branch} />
      </section>

      <DataTable
        title="Product catalogue"
        description="Newest first"
        columns={columns}
        rows={filtered}
        toolbar={
          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger className="h-9 w-44 rounded-lg text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </AppShell>
  );
}