"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { createPurchaseOrder } from "@/app/actions/procurement";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCurrency } from "@/components/currency-provider";

export type PurchaseOrderProduct = {
  id: number;
  name: string;
  stock: number;
  buyingPrice: number;
  /** Pre-filled reorder quantity — the caller decides what "enough" means (e.g. its low-stock threshold). */
  suggestedQty?: number;
};

type Line = { productId: number; name: string; quantity: number; unitCost: number };

type Props = {
  trigger: ReactNode;
  suppliers: { id: number; name: string }[];
  products: PurchaseOrderProduct[];
  /** Product ids to seed as line items the moment the dialog opens — e.g. everything currently low on stock. */
  initialProductIds?: number[];
  onCreated?: () => void;
};

export function CreatePurchaseOrderDialog({ trigger, suppliers, products, initialProductIds, onCreated }: Props) {
  const { format: currency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState(suppliers[0] ? String(suppliers[0].id) : "");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [addingId, setAddingId] = useState("");
  const [pending, startTransition] = useTransition();

  const byId = new Map(products.map((p) => [p.id, p]));
  const availableToAdd = products.filter((p) => !lines.some((l) => l.productId === p.id));
  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  const seed = () => {
    if (!initialProductIds?.length) return;
    const seeded = initialProductIds
      .map((id) => byId.get(id))
      .filter((p): p is PurchaseOrderProduct => Boolean(p))
      .map((p) => ({ productId: p.id, name: p.name, quantity: p.suggestedQty ?? 1, unitCost: p.buyingPrice }));
    setLines(seeded);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && lines.length === 0) seed();
  };

  const addLine = () => {
    const product = byId.get(Number(addingId));
    if (!product) return;
    setLines((ls) => [...ls, { productId: product.id, name: product.name, quantity: product.suggestedQty ?? 1, unitCost: product.buyingPrice }]);
    setAddingId("");
  };

  const updateLine = (productId: number, patch: Partial<Line>) => {
    setLines((ls) => ls.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));
  };

  const removeLine = (productId: number) => {
    setLines((ls) => ls.filter((l) => l.productId !== productId));
  };

  const submit = () => {
    if (lines.length === 0) {
      toast.error("Add at least one item to order.");
      return;
    }
    startTransition(async () => {
      const result = await createPurchaseOrder({
        supplierId: supplierId ? Number(supplierId) : null,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitCost })),
        notes,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      setLines([]);
      setNotes("");
      onCreated?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New purchase order</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Supplier</Label>
            {suppliers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No suppliers on file yet — this order will be created without one; add a supplier later if needed.
              </p>
            ) : (
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Choose a supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Items</Label>
            {lines.length === 0 && (
              <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">No items yet — add one below.</p>
            )}
            <div className="grid gap-2">
              {lines.map((l) => (
                <div key={l.productId} className="grid grid-cols-[minmax(0,1fr)_5rem_6rem_auto] items-center gap-2 rounded-lg border border-border p-2">
                  <span className="min-w-0 truncate text-sm font-medium">{l.name}</span>
                  <Input
                    type="number"
                    min={1}
                    value={l.quantity}
                    onChange={(e) => updateLine(l.productId, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                    className="h-8 text-sm"
                    aria-label={`Quantity for ${l.name}`}
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={l.unitCost}
                    onChange={(e) => updateLine(l.productId, { unitCost: Math.max(0, Number(e.target.value) || 0) })}
                    className="h-8 text-sm"
                    aria-label={`Unit cost for ${l.name}`}
                  />
                  <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 rounded-lg text-destructive" onClick={() => removeLine(l.productId)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {availableToAdd.length > 0 && (
              <div className="mt-1 flex gap-2">
                <Select value={addingId} onValueChange={setAddingId}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Add a product…" /></SelectTrigger>
                  <SelectContent>
                    {availableToAdd.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name} · {p.stock} in stock</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 rounded-lg" onClick={addLine} disabled={!addingId}>
                  <Plus className="size-4" /> Add
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. deliver to Main branch by Friday" />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-accent/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Total cost</span>
            <span className="num font-semibold">{currency(total)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={pending} className="rounded-lg">
            {pending ? "Creating…" : "Create purchase order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
