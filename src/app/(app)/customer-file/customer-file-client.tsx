"use client";

import type { viewCustomerFile } from "@/db/queries/views";
import { notFound } from "next/navigation";

import { ArrowLeft, Mail, Phone, Wallet, CreditCard } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { currency } from "@/lib/format";


type Tx = NonNullable<Awaited<ReturnType<typeof viewCustomerFile>>>["transactions"][number];

const columns: Column<Tx>[] = [
  { key: "date", header: "Date & Time", render: (t) => <span className="num text-muted-foreground">{t.date}</span> },
  { key: "branch", header: "Branch", render: (t) => t.branch },
  { key: "ref", header: "Invoice/Receipt No.", render: (t) => <span className="num font-medium">{t.ref}</span> },
  { key: "products", header: "Products", render: (t) => t.products },
  { key: "paid", header: "Amount Paid", align: "right", render: (t) => <span className="num">{currency(t.paid)}</span> },
  { key: "credited", header: "Amount Credited", align: "right", render: (t) => <span className="num">{currency(t.credited)}</span> },
  {
    key: "status",
    header: "Status",
    render: (t) => (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${t.status === "paid" ? "bg-success/12 text-success" : "bg-warning/15 text-warning-foreground"}`}>
        {t.status}
      </span>
    ),
  },
];

type Props = {
  customerFile: NonNullable<Awaited<ReturnType<typeof viewCustomerFile>>>;
};

export default function CustomerFilePage({ customerFile }: Props) {
  const { customer, transactions: customerTransactions } = customerFile;
  return (
    <AppShell
      title={customer.name}
      subtitle="Customer file"
      actions={
        <Link href="/">
          <Button variant="outline" size="sm" className="rounded-lg"><ArrowLeft className="mr-2 size-4" /> Back</Button>
        </Link>
      }
    >
      <section className="panel grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field icon={Phone} label="Contact" value={customer.contact} />
        <Field icon={Mail} label="Email" value={customer.email} />
        <Field icon={CreditCard} label="Payment method" value={customer.paymentMethod} />
        <Field icon={Wallet} label="Opening date" value={customer.openingDate} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Account balance" value={currency(customer.accountBalance)} icon={Wallet} hint="available credit" />
        <StatCard label="Amount credited" value={currency(customer.amountCredited)} icon={CreditCard} hint="outstanding debt" />
      </section>

      <DataTable title="Recent transactions" columns={columns} rows={customerTransactions} />
    </AppShell>
  );
}

function Field({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
