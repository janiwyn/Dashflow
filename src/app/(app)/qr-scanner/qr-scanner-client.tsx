"use client";

import { useState } from "react";
import { QrCode, ScanLine, CheckCircle2, RefreshCcw } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/components/currency-provider";
import type { viewRemoteOrders } from "@/db/queries/views";

type Props = {
  remoteOrders: Awaited<ReturnType<typeof viewRemoteOrders>>;
};

export default function QrScannerPage({ remoteOrders }: Props) {
  const { format: currency } = useCurrency();
  const [scanned, setScanned] = useState<Props["remoteOrders"][number] | null>(null);
  const [method, setMethod] = useState("Cash");
  const [recorded, setRecorded] = useState<string | null>(null);

  const simulateScan = () => {
    const pending = remoteOrders.find((o) => o.status === "Pending");
    setScanned(pending ?? remoteOrders[0] ?? null);
    setRecorded(null);
  };

  const reset = () => {
    setScanned(null);
    setRecorded(null);
  };

  const recordSale = () => {
    setRecorded("RP-" + Math.floor(10000 + Math.random() * 89999));
  };

  return (
    <AppShell title="QR Code Scanner" subtitle="Complete remote orders at pickup">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel flex min-h-[420px] flex-col items-center justify-center gap-4 p-6">
          <div className="flex size-56 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40">
            <QrCode className="size-24 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Point camera at customer's order QR code</p>
          <Button onClick={simulateScan} className="rounded-lg">
            <ScanLine className="mr-2 size-4" /> Simulate scan
          </Button>
        </div>

        <div className="panel min-h-[420px] p-6">
          {!scanned ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Scan a QR code to view order details
            </div>
          ) : (
            <div className="space-y-5">
              <h2 className="text-base font-semibold">Order details</h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Order Reference" value={scanned.ref} />
                <Field label="Branch" value={scanned.branch} />
                <Field label="Customer Name" value={scanned.customer} />
                <Field label="Customer Phone" value={scanned.phone} />
                <Field label="Expected Amount" value={currency(scanned.amount)} />
                <Field label="Order Date" value={scanned.date} />
              </dl>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Order items</h3>
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground">
                    <tr><th className="py-1 text-left">Product</th><th className="text-left">Qty</th><th className="text-right">Unit</th><th className="text-right">Subtotal</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {scanned.items.map((it) => (
                      <tr key={it.name}>
                        <td className="py-2">{it.name}</td>
                        <td className="num">{it.qty}</td>
                        <td className="num text-right">{currency(it.price)}</td>
                        <td className="num text-right font-medium">{currency(it.price * it.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {recorded ? (
                <div className="rounded-lg bg-success/10 p-4 text-sm text-success">
                  <CheckCircle2 className="mb-1 size-5" />
                  Sale recorded successfully. Receipt no. <span className="num font-semibold">{recorded}</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="h-9 w-[160px] rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                      <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                      <SelectItem value="Bank">Bank</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={recordSale} className="rounded-lg">
                    <CheckCircle2 className="mr-2 size-4" /> Complete order
                  </Button>
                </div>
              )}
              <Button variant="outline" onClick={reset} className="rounded-lg">
                <RefreshCcw className="mr-2 size-4" /> Scan another code
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
