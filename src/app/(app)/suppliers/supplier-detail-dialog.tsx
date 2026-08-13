"use client";

import { useState, type ReactNode } from "react";

import { fetchSupplierSuppliedProducts } from "@/app/actions/procurement";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCurrency } from "@/components/currency-provider";
import type { SuppliedProductRow } from "@/db/queries/procurement";
import type { viewPurchaseOrders, viewSuppliers } from "@/db/queries/views";

type Supplier = Awaited<ReturnType<typeof viewSuppliers>>[number];
type PurchaseOrder = Awaited<ReturnType<typeof viewPurchaseOrders>>[number];

type Props = {
  trigger: ReactNode;
  supplier: Supplier;
  orders: PurchaseOrder[];
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium">{value}</p>
    </div>
  );
}

export function SupplierDetailDialog({ trigger, supplier, orders }: Props) {
  const { format: currency } = useCurrency();
  const [products, setProducts] = useState<SuppliedProductRow[] | null>(null);
  const supplierOrders = orders.filter((o) => o.supplierId === supplier.id);

  const handleOpenChange = (next: boolean) => {
    if (next && products === null) {
      fetchSupplierSuppliedProducts(supplier.id).then(setProducts);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{supplier.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
            <Field label="Category" value={supplier.category} />
            <Field label="Contact person" value={supplier.contactPerson ?? "—"} />
            <Field label="Phone" value={supplier.contact ?? "—"} />
            <Field label="Email" value={supplier.email ?? "—"} />
            <Field label="Address" value={supplier.address ?? "—"} />
            <Field label="Payment terms" value={supplier.paymentTerms ?? "—"} />
            <Field label="Last delivery" value={supplier.lastDelivery} />
            <Field label="Payable" value={currency(supplier.payable)} />
          </div>

          <div>
            <h3 className="text-sm font-semibold">What they supply</h3>
            {products === null ? (
              <p className="mt-2 text-xs text-muted-foreground">Loading…</p>
            ) : products.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                No purchase orders placed with this supplier yet — this fills in once you order from them.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {products.map((p) => (
                  <li key={p.productId ?? p.productName} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0 truncate">{p.productName}</span>
                    <span className="num shrink-0 text-xs text-muted-foreground">
                      {p.totalQuantity} units · {p.orderCount} order{p.orderCount === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold">Order history</h3>
            {supplierOrders.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No purchase orders yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {supplierOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="num text-muted-foreground">{o.reference}</span>
                    <span className="text-xs text-muted-foreground">{o.orderedAt} · {o.status}</span>
                    <span className="num font-medium">{currency(o.totalCost)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
