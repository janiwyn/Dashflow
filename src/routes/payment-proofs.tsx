import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ImageIcon } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { branches, paymentProofs, type PaymentProof } from "@/lib/sales-ops-data";

export const Route = createFileRoute("/payment-proofs")({
  head: () => ({
    meta: [
      { title: "Payment Proofs — Meridian POS" },
      { name: "description", content: "Verify MTN and Airtel mobile money payment screenshots submitted for remote orders." },
      { property: "og:title", content: "Payment Proofs — Meridian POS" },
      { property: "og:description", content: "Verify mobile money payment proofs." },
    ],
  }),
  component: PaymentProofsPage,
});

function StatusBadge({ status }: { status: PaymentProof["status"] }) {
  const tone =
    status === "Pending" ? "bg-warning/15 text-warning-foreground" : status === "Verified" ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{status}</span>;
}

function PaymentProofsPage() {
  const [proofs, setProofs] = useState(paymentProofs);
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(
    () => proofs.filter((p) => (branch === "all" || p.branch === branch) && (status === "all" || p.status === status)),
    [proofs, branch, status],
  );

  const verify = (ref: string) => setProofs((prev) => prev.map((p) => (p.ref === ref ? { ...p, status: "Verified" } : p)));

  const columns = (method: "MTN Merchant" | "Airtel Merchant"): Column<PaymentProof>[] => [
    { key: "ref", header: "Order Ref", render: (r) => <span className="num font-medium">{r.ref}</span> },
    { key: "branch", header: "Branch", render: (r) => r.branch },
    { key: "customer", header: "Customer", render: (r) => r.customer },
    { key: "phone", header: "Phone", render: (r) => <span className="num text-muted-foreground">{r.phone}</span> },
    { key: "location", header: "Delivery Location", render: (r) => r.location },
    {
      key: "screenshot",
      header: "Screenshot",
      render: () => (
        <Button variant="outline" size="sm" className="h-7 rounded-lg text-xs">
          <ImageIcon className="mr-1 size-3.5" /> View
        </Button>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "date", header: "Date", render: (r) => <span className="num text-muted-foreground">{r.date}</span> },
    {
      key: "actions",
      header: "Actions",
      render: (r) =>
        r.status === "Pending" ? (
          <Button size="sm" className="h-7 rounded-lg text-xs" onClick={() => verify(r.ref)}>
            <CheckCircle2 className="mr-1 size-3.5" /> Verify
          </Button>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
  ];

  const toolbar = (
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
          <SelectItem value="Verified">Verified</SelectItem>
          <SelectItem value="Rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <AppShell title="Payment Proofs" subtitle="Verify mobile money payments for remote orders">
      <Tabs defaultValue="mtn">
        <TabsList>
          <TabsTrigger value="mtn">M-Pesa Merchant</TabsTrigger>
          <TabsTrigger value="airtel">Airtel Money</TabsTrigger>
        </TabsList>
        <TabsContent value="mtn" className="mt-4">
          <DataTable
            title="M-Pesa Merchant payment proofs"
            columns={columns("MTN Merchant")}
            rows={filtered.filter((p) => p.method === "MTN Merchant")}
            toolbar={toolbar}
          />
        </TabsContent>
        <TabsContent value="airtel" className="mt-4">
          <DataTable
            title="Airtel Money payment proofs"
            columns={columns("Airtel Merchant")}
            rows={filtered.filter((p) => p.method === "Airtel Merchant")}
            toolbar={toolbar}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}