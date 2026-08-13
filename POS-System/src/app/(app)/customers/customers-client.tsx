"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { deleteCustomer } from "@/app/actions/customers";
import type { viewCustomers } from "@/db/queries/views";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/components/currency-provider";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";

type Customer = Awaited<ReturnType<typeof viewCustomers>>[number];

type Props = {
  customers: Awaited<ReturnType<typeof viewCustomers>>;
};

export default function CustomersPage({ customers }: Props) {
  const { format: currency } = useCurrency();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const overdueCount = customers.filter((c) => c.balance > 0).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, query]);

  const remove = (customer: Customer) => {
    if (!confirm(`Remove ${customer.name}? Their past sales keep their history either way.`)) return;
    startTransition(async () => {
      const result = await deleteCustomer(customer.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      render: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-xs font-semibold text-accent-foreground">
            {c.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="truncate font-medium">{c.name}</span>
        </div>
      ),
    },
    { key: "type", header: "Type", render: (c) => <span className="text-muted-foreground">{c.type}</span> },
    { key: "orders", header: "Orders", render: (c) => <span className="num">{c.orders}</span> },
    { key: "spend", header: "Lifetime spend", align: "right", render: (c) => <span className="num">{currency(c.spend)}</span> },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      render: (c) => (
        <span className={`num font-semibold ${c.balance > 0 ? "text-destructive" : "text-muted-foreground"}`}>
          {currency(c.balance)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="size-8 rounded-lg" asChild>
            <Link href={`/customer-file?id=${c.id}`}>
              <Eye className="size-3.5" />
            </Link>
          </Button>
          <CustomerFormDialog
            trigger={
              <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                <Pencil className="size-3.5" />
              </Button>
            }
            customer={c}
            onSaved={() => router.refresh()}
          />
          <Button variant="ghost" size="icon" className="size-8 rounded-lg text-destructive" onClick={() => remove(c)} disabled={pending}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Customers"
      subtitle={`${customers.length} account${customers.length === 1 ? "" : "s"} · ${overdueCount} with overdue balance${overdueCount === 1 ? "" : "s"}`}
      actions={
        <CustomerFormDialog
          trigger={
            <Button size="sm" className="rounded-lg">
              <Plus className="size-4" /> Add customer
            </Button>
          }
          onSaved={() => router.refresh()}
        />
      }
    >
      <DataTable
        title="Accounts"
        description={`${filtered.length} of ${customers.length} shown`}
        columns={columns}
        rows={filtered}
        minWidth={780}
        toolbar={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers…"
              className="h-9 w-52 rounded-lg pl-8 text-sm"
            />
          </div>
        }
      />
    </AppShell>
  );
}
