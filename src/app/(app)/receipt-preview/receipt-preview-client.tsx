"use client";

import type { viewReceipt } from "@/db/queries/views";
import { useState } from "react";
import { toast } from "sonner";

import { Printer, X } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/components/currency-provider";
import { currencyMeta } from "@/lib/currency";
import { usePrinter } from "@/components/printer-provider";


type Props = {
  receiptSample: NonNullable<Awaited<ReturnType<typeof viewReceipt>>>;
  businessName: string;
};

export default function ReceiptPreviewPage({ receiptSample, businessName }: Props) {
  const { format: currency, code } = useCurrency();
  const printer = usePrinter();
  const [printing, setPrinting] = useState(false);
  const subtotal = receiptSample.items.reduce((s, it) => s + it.qty * it.price, 0);
  const paid = subtotal;
  const balance = 0;

  const onPrint = async () => {
    if (printer.status !== "connected") {
      window.print();
      return;
    }
    setPrinting(true);
    try {
      await printer.printReceipt({
        businessName,
        reference: receiptSample.invoiceNo,
        date: receiptSample.date,
        cashier: receiptSample.cashier,
        customer: receiptSample.customerName,
        method: receiptSample.method,
        items: receiptSample.items.map((it) => ({
          name: it.name,
          qty: it.qty,
          unitPrice: it.price,
          lineTotal: it.qty * it.price,
        })),
        subtotal,
        total: paid,
        currencySymbol: currencyMeta(code).symbol,
      });
      toast.success(`Sent to ${printer.deviceName}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not print the receipt.");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <AppShell title="Receipt Preview" subtitle="Confirm receipt details before printing">
      <div className="mx-auto max-w-lg">
        <div className="panel p-6">
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div>
              <p className="font-display text-base font-semibold">Meridian Retail Ltd</p>
              <p className="text-xs text-muted-foreground">Receipt</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Ref: <span className="num font-medium text-foreground">{receiptSample.invoiceNo}</span></p>
              <p className="num">{receiptSample.date}</p>
            </div>
          </div>

          <div className="mt-4 text-sm">
            <p><span className="text-muted-foreground">Customer:</span> {receiptSample.customerName}</p>
            <p><span className="text-muted-foreground">Cashier:</span> {receiptSample.cashier}</p>
            <p><span className="text-muted-foreground">Payment method:</span> {receiptSample.method}</p>
          </div>

          <table className="mt-4 w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 text-left">Item</th>
                <th className="text-left">Qty</th>
                <th className="text-right">Unit</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {receiptSample.items.map((it) => (
                <tr key={it.name}>
                  <td className="py-2">{it.name}</td>
                  <td className="num">{it.qty}</td>
                  <td className="num text-right">{currency(it.price)}</td>
                  <td className="num text-right font-medium">{currency(it.qty * it.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="num">{currency(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Paid</dt><dd className="num">{currency(paid)}</dd></div>
            <div className="flex justify-between font-semibold"><dt>Balance</dt><dd className="num">{currency(balance)}</dd></div>
          </dl>

          <div className="mt-6 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {printer.status === "connected"
                ? `Printing to ${printer.deviceName} over Bluetooth`
                : "No Bluetooth printer connected — will use your browser's print dialog"}
            </p>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" className="rounded-lg"><X className="mr-2 size-4" /> Close</Button>
              <Button className="rounded-lg" onClick={onPrint} disabled={printing}>
                <Printer className="mr-2 size-4" /> {printing ? "Printing…" : "Print receipt"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
