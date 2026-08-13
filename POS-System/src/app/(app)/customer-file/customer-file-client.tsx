"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Pencil, Phone, Wallet, CreditCard } from "lucide-react";

import type { viewCustomerFile, viewCustomers } from "@/db/queries/views";
import { AppShell } from "@/components/app-shell";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/components/currency-provider";

type Tx = NonNullable<Awaited<ReturnType<typeof viewCustomerFile>>>["transactions"][number];

type Props = {
  customerFile: NonNullable<Awaited<ReturnType<typeof viewCustomerFile>>>;
  allCustomers: Awaited<ReturnType<typeof viewCustomers>>;
};

export default function CustomerFilePage({ customerFile, allCustomers }: Props) {
  const { format: currency } = useCurrency();
  const router = useRouter();

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

  const { customer, transactions: customerTransactions } = customerFile;
  const currentInList = allCustomers.find((c) => c.id === customer.id);

  return (
    <AppShell
      title={customer.name}
      subtitle="Customer file"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(customer.id)} onValueChange={(v) => router.push(`/customer-file?id=${v}`)}>
            <SelectTrigger className="h-9 w-48 rounded-lg text-sm"><SelectValue placeholder="Switch customer" /></SelectTrigger>
            <SelectContent>
              {allCustomers.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentInList && (
            <CustomerFormDialog
              trigger={
                <Button variant="outline" size="sm" className="rounded-lg">
                  <Pencil className="size-4" /> Edit
                </Button>
              }
              customer={currentInList}
              onSaved={() => router.refresh()}
            />
          )}
          <Link href="/customers">
            <Button variant="outline" size="sm" className="rounded-lg"><ArrowLeft className="size-4" /> Back</Button>
          </Link>
        </div>
      }
    >
      <section className="panel grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field icon={Phone} label="Contact" value={customer.contact} />
        <Field icon={Mail} label="Email" value={customer.email} />
        <Field icon={CreditCard} label="Payment method" value={customer.paymentMethod} />
        <Field icon={Wallet} label="Opening date" value={customer.openingDate} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Account balance" value={currency(customer.accountBalance)} icon={Wallet} hint="outstanding — what they owe" />
        <StatCard label="Amount credited" value={currency(customer.amountCredited)} icon={CreditCard} hint="lifetime credit extended" />
      </section>

      <DataTable
        title="Recent transactions"
        description={customerTransactions.length === 0 ? "No sales linked to this customer yet" : undefined}
        columns={columns}
        rows={customerTransactions}
      />
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
