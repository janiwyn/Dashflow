import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/pos-data";
import { invoicePreview } from "@/lib/accounting-data";

export const Route = createFileRoute("/invoice-preview")({
  head: () => ({
    meta: [
      { title: "Invoice Preview — Meridian POS" },
      { name: "description", content: "Preview and print a customer sales invoice." },
      { property: "og:title", content: "Invoice Preview — Meridian POS" },
      { property: "og:description", content: "Preview and print a customer sales invoice." },
    ],
  }),
  component: InvoicePreviewPage,
});

function InvoicePreviewPage() {
  const inv = invoicePreview;
  const subTotal = inv.items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = Math.round((subTotal * inv.taxRate) / 100);
  const total = subTotal + tax;
  const balance = total - inv.amountPaid;

  return (
    <AppShell
      title="Invoice Preview"
      subtitle={`Invoice ${inv.invoiceNo}`}
      actions={
        <Button size="sm" className="rounded-lg" onClick={() => window.print()}>
          <Printer className="size-4" /> Print
        </Button>
      }
    >
      <section className="panel mx-auto max-w-3xl p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
              {inv.company.name.charAt(0)}
            </div>
            <p className="mt-3 text-lg font-semibold">{inv.company.name}</p>
            <p className="text-sm text-muted-foreground">{inv.company.tagline}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {inv.company.address}
              <br />
              PIN: {inv.company.pin}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Invoice</p>
            <p className="num text-xl font-bold">{inv.invoiceNo}</p>
          </div>
        </div>

        <div className="grid gap-4 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Bill To</p>
            <p className="mt-1 font-medium">{inv.customer.name}</p>
            <p className="text-sm text-muted-foreground">{inv.customer.email}</p>
            <p className="text-sm text-muted-foreground">{inv.customer.contact}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-muted-foreground">Invoice Date</p>
            <p className="num">{inv.date}</p>
            <p className="mt-2 text-xs uppercase text-muted-foreground">Due Date</p>
            <p className="num">{inv.dueDate}</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase text-muted-foreground">
              <th className="border-b border-border py-2 text-left">#</th>
              <th className="border-b border-border py-2 text-left">Item</th>
              <th className="border-b border-border py-2 text-right">Qty</th>
              <th className="border-b border-border py-2 text-right">Rate</th>
              <th className="border-b border-border py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {inv.items.map((item, i) => (
              <tr key={item.id}>
                <td className="py-2.5">{i + 1}</td>
                <td className="py-2.5">
                  {item.name}
                  <div className="text-xs text-muted-foreground">SKU: {item.id}</div>
                </td>
                <td className="py-2.5 text-right num">{item.qty}</td>
                <td className="py-2.5 text-right num">{currency(item.price)}</td>
                <td className="py-2.5 text-right num">{currency(item.qty * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-4 w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Sub Total</span><span className="num">{currency(subTotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax ({inv.taxRate}%)</span><span className="num">{currency(tax)}</span></div>
          <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Total</span><span className="num">{currency(total)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Amount Paid</span><span className="num">{currency(inv.amountPaid)}</span></div>
          <div className="flex justify-between font-semibold text-destructive"><span>Balance Due</span><span className="num">{currency(balance)}</span></div>
        </div>
      </section>
    </AppShell>
  );
}