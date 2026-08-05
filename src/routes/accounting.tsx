import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus,
  Banknote,
  BookOpen,
  Scale,
  Calculator as CashRegisterIcon,
  BookMarked,
  FileText,
  Landmark,
} from "lucide-react";
import { CircleDollarSign } from "lucide-react";

import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/accounting")({
  head: () => ({
    meta: [
      { title: "Accounting — Meridian POS" },
      { name: "description", content: "Chart of accounts, ledgers, cash books and financial statements." },
      { property: "og:title", content: "Accounting — Meridian POS" },
      { property: "og:description", content: "Chart of accounts, ledgers, cash books and financial statements." },
    ],
  }),
  component: AccountingPage,
});

const tiles = [
  { to: "/add-account", title: "Add Account", desc: "Create a new account for your business.", icon: Plus },
  { to: "/add-transaction", title: "Transactions", desc: "Record income or expenses.", icon: Banknote },
  { to: "/ledger", title: "Ledger", desc: "View detailed account transactions.", icon: BookOpen },
  { to: "/trial-balance", title: "Trial Balance", desc: "Check account balances quickly.", icon: Scale },
  { to: "/add-cash-entry", title: "Cash Entry", desc: "Record daily cash movements.", icon: CashRegisterIcon },
  { to: "/cash-book", title: "Cash Book", desc: "View cash flow overview.", icon: BookMarked },
  { to: "/income-statement", title: "Income Statement", desc: "Check your business profitability.", icon: FileText },
  { to: "/balance-sheet", title: "Balance Sheet", desc: "View assets, liabilities, and equity.", icon: Landmark },
  { to: "/petty-cash", title: "Petty Cash", desc: "Manage petty cash float and transactions.", icon: CircleDollarSign },
] as const;

function AccountingPage() {
  return (
    <AppShell title="Accounting" subtitle="Chart of accounts, ledgers & financial statements">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="panel flex flex-col items-center gap-3 border-l-4 border-l-primary p-6 text-center transition-colors hover:bg-muted/40">
            <t.icon className="size-8 text-primary" />
            <h3 className="text-base font-semibold">{t.title}</h3>
            <p className="text-sm text-muted-foreground">{t.desc}</p>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}