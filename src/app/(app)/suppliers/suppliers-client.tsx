"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, PackageCheck, Pencil, Plus, Trash2, X } from "lucide-react";

import { cancelPurchaseOrder, fetchPurchaseOrderItems, receivePurchaseOrder } from "@/app/actions/procurement";
import { deleteSupplier } from "@/app/actions/suppliers";
import type { PurchaseOrderItemRow } from "@/db/queries/procurement";
import type { viewPurchaseOrders, viewStockProducts, viewSuppliers } from "@/db/queries/views";
import { AppShell } from "@/components/app-shell";
import { CreatePurchaseOrderDialog } from "@/components/procurement/create-purchase-order-dialog";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrency } from "@/components/currency-provider";
import { SupplierDetailDialog } from "./supplier-detail-dialog";
import { SupplierFormDialog } from "./supplier-form-dialog";

type Supplier = Awaited<ReturnType<typeof viewSuppliers>>[number];
type PurchaseOrder = Awaited<ReturnType<typeof viewPurchaseOrders>>[number];

type Props = {
  suppliers: Awaited<ReturnType<typeof viewSuppliers>>;
  products: Awaited<ReturnType<typeof viewStockProducts>>;
  purchaseOrders: Awaited<ReturnType<typeof viewPurchaseOrders>>;
  categories: { id: number; name: string }[];
};

const STATUS_STYLE: Record<string, string> = {
  Pending: "bg-warning/15 text-warning-foreground",
  Received: "bg-success/12 text-success",
  Cancelled: "bg-muted text-muted-foreground",
};

export default function SuppliersPage({ suppliers, products, purchaseOrders, categories }: Props) {
  const { format: currency } = useCurrency();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null);
  const [items, setItems] = useState<PurchaseOrderItemRow[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const removeSupplier = (supplier: Supplier) => {
    if (!confirm(`Remove ${supplier.name}? Past purchase orders keep their history either way.`)) return;
    startTransition(async () => {
      const result = await deleteSupplier(supplier.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const supplierColumns: Column<Supplier>[] = [
    { key: "name", header: "Supplier", render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "category", header: "Supplies", render: (s) => <span className="text-muted-foreground">{s.category}</span> },
    { key: "contactPerson", header: "Contact person", render: (s) => <span className="text-muted-foreground">{s.contactPerson ?? "—"}</span> },
    { key: "contact", header: "Phone", render: (s) => <span className="num text-muted-foreground">{s.contact ?? "—"}</span> },
    { key: "last", header: "Last delivery", render: (s) => <span className="text-muted-foreground">{s.lastDelivery}</span> },
    {
      key: "payable",
      header: "Payable",
      align: "right",
      render: (s) => (
        <span className={`num font-semibold ${s.payable > 0 ? "text-destructive" : "text-muted-foreground"}`}>
          {currency(s.payable)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <div className="flex justify-end gap-1">
          <SupplierDetailDialog
            trigger={
              <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                <Eye className="size-3.5" />
              </Button>
            }
            supplier={s}
            orders={purchaseOrders}
          />
          <SupplierFormDialog
            trigger={
              <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                <Pencil className="size-3.5" />
              </Button>
            }
            categories={categories}
            supplier={s}
            onSaved={() => router.refresh()}
          />
          <Button variant="ghost" size="icon" className="size-8 rounded-lg text-destructive" onClick={() => removeSupplier(s)} disabled={pending}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const openItems = (po: PurchaseOrder) => {
    setViewing(po);
    setLoadingItems(true);
    fetchPurchaseOrderItems(po.id)
      .then(setItems)
      .finally(() => setLoadingItems(false));
  };

  const receive = (po: PurchaseOrder) => {
    startTransition(async () => {
      const result = await receivePurchaseOrder(po.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const cancel = (po: PurchaseOrder) => {
    startTransition(async () => {
      const result = await cancelPurchaseOrder(po.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const poColumns: Column<PurchaseOrder>[] = [
    { key: "reference", header: "Reference", render: (po) => <span className="num font-medium">{po.reference}</span> },
    { key: "supplier", header: "Supplier", render: (po) => po.supplier },
    { key: "items", header: "Items", align: "right", render: (po) => <span className="num">{po.itemCount}</span> },
    { key: "total", header: "Total", align: "right", render: (po) => <span className="num font-semibold">{currency(po.totalCost)}</span> },
    {
      key: "status",
      header: "Status",
      render: (po) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[po.status] ?? "bg-muted text-muted-foreground"}`}>
          {po.status}
        </span>
      ),
    },
    { key: "ordered", header: "Ordered", render: (po) => <span className="text-muted-foreground">{po.orderedAt}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (po) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => openItems(po)}>
            <Eye className="size-3.5" />
          </Button>
          {po.status === "Pending" && (
            <>
              <Button variant="ghost" size="icon" className="size-8 rounded-lg text-success" onClick={() => receive(po)} disabled={pending}>
                <PackageCheck className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8 rounded-lg text-destructive" onClick={() => cancel(po)} disabled={pending}>
                <X className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Suppliers"
      subtitle={`${suppliers.length} active suppliers · ${currency(suppliers.reduce((s, x) => s + x.payable, 0))} payable`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <SupplierFormDialog
            trigger={
              <Button variant="outline" size="sm" className="rounded-lg">
                <Plus className="size-4" /> Add supplier
              </Button>
            }
            categories={categories}
            onSaved={() => router.refresh()}
          />
          <CreatePurchaseOrderDialog
            trigger={<Button size="sm" className="rounded-lg">New purchase order</Button>}
            suppliers={suppliers}
            products={products.map((p) => ({ id: p.id, name: p.name, stock: p.stock, buyingPrice: p.buyingPrice }))}
            onCreated={() => router.refresh()}
          />
        </div>
      }
    >
      <DataTable
        title="Supplier register"
        description="Contacts, what they supply, and what's owed to each"
        columns={supplierColumns}
        rows={suppliers}
        minWidth={960}
      />
      <DataTable
        title="Purchase orders"
        description={`${purchaseOrders.length} order${purchaseOrders.length === 1 ? "" : "s"}`}
        columns={poColumns}
        rows={purchaseOrders}
        minWidth={780}
      />

      <Dialog open={Boolean(viewing)} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.reference}</DialogTitle>
          </DialogHeader>
          {loadingItems ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No items on this order.</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate">{item.productName}</span>
                  <span className="num shrink-0 text-muted-foreground">
                    {item.quantity} × {currency(item.unitCost)} = <span className="font-medium text-foreground">{currency(item.subtotal)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {viewing?.notes && (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Notes: {viewing.notes}</p>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
