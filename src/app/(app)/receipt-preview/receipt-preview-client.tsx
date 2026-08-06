"use client";

import type { viewReceipt } from "@/db/queries/views";
import { notFound } from "next/navigation";

import { Printer, X } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/format";


type Props = {
  receiptSample: NonNullable<Awaited<ReturnType<typeof viewReceipt>>>;
};

export default function ReceiptPreviewPage({ receiptSample }: Props) {
  const subtotal = receiptSample.items.reduce((s, it) => s + it.qty * it.price, 0);
  const paid = subtotal;
  const balance = 0;
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

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" className="rounded-lg"><X className="mr-2 size-4" /> Close</Button>
            <Button className="rounded-lg"><Printer className="mr-2 size-4" /> Print receipt</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
