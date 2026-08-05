import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, CheckCircle2, ShoppingBag, Eye, X } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { branches, currency, remoteOrders, type RemoteOrder } from "@/lib/sales-ops-data";

export const Route = createFileRoute("/remote-orders")({
  head: () => ({
    meta: [
      { title: "Remote Orders — Meridian POS" },
      { name: "description", content: "Review, verify and process customer orders placed through the online storefront." },
      { property: "og:title", content: "Remote Orders — Meridian POS" },
      { property: "og:description", content: "Review and process online customer orders." },
    ],
  }),
  component: RemoteOrdersPage,
});

function StatusBadge({ status }: { status: RemoteOrder["status"] }) {
  const tone =
    status === "Pending" ? "bg-warning/15 text-warning-foreground" : status === "Finished" ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{status}</span>;
}

function RemoteOrdersPage() {
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState(remoteOrders);
  const [viewing, setViewing] = useState<RemoteOrder | null>(null);

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (branch === "all" || o.branch === branch) &&
          (status === "all" || o.status === status) &&
          o.customer.toLowerCase().includes(search.toLowerCase()),
      ),
    [orders, branch, status, search],
  );

  const pending = orders.filter((o) => o.status === "Pending").length;
  const finished = orders.filter((o) => o.status === "Finished").length;

  const setOrderStatus = (ref: string, s: RemoteOrder["status"]) =>
    setOrders((prev) => prev.map((o) => (o.ref === ref ? { ...o, status: s } : o)));

  const columns: Column<RemoteOrder>[] = [
    { key: "ref", header: "Order Ref", render: (r) => <span className="num font-medium">{r.ref}</span> },
    { key: "date", header: "Date & Time", render: (r) => <span className="num text-muted-foreground">{r.date}</span> },
    { key: "branch", header: "Branch", render: (r) => r.branch },
    { key: "customer", header: "Customer", render: (r) => r.customer },
    { key: "phone", header: "Phone", render: (r) => <span className="num text-muted-foreground">{r.phone}</span> },
    {
      key: "items",
      header: "Products",
      render: (r) => (
        <Button variant="outline" size="sm" className="h-7 rounded-lg text-xs" onClick={() => setViewing(r)}>
          <Eye className="mr-1 size-3.5" /> View ({r.items.length})
        </Button>
      ),
    },
    { key: "amount", header: "Amount", align: "right", render: (r) => <span className="num font-semibold text-success">{currency(r.amount)}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (r) =>
        r.status === "Pending" ? (
          <Button variant="destructive" size="sm" className="h-7 rounded-lg text-xs" onClick={() => setOrderStatus(r.ref, "Cancelled")}>
            <X className="mr-1 size-3.5" /> Cancel
          </Button>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
  ];

  return (
    <AppShell title="Remote Orders" subtitle="Orders placed through the online storefront">
      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Pending orders" value={String(pending)} icon={Clock} hint="awaiting fulfilment" />
        <StatCard label="Finished orders" value={String(finished)} icon={CheckCircle2} hint="completed" />
      </section>

      <DataTable
        title="All remote orders"
        description="Newest first"
        columns={columns}
        rows={filtered}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="h-9 w-[140px] rounded-lg text-sm"><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-[140px] rounded-lg text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Finished">Finished</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Search customer" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-[180px] rounded-lg" />
          </div>
        }
      />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShoppingBag className="size-4" /> {viewing?.ref}</DialogTitle>
          </DialogHeader>
          <ul className="divide-y divide-border text-sm">
            {viewing?.items.map((it) => (
              <li key={it.name} className="flex items-center justify-between py-2">
                <span>{it.name} × {it.qty}</span>
                <span className="num font-medium">{currency(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}