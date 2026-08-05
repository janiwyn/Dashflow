import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { branches, currency } from "@/lib/pos-data";

export const Route = createFileRoute("/branches")({
  head: () => ({
    meta: [
      { title: "Branches — Meridian POS" },
      { name: "description", content: "Monitor every branch: managers, staffing and today's takings." },
      { property: "og:title", content: "Branches — Meridian POS" },
      { property: "og:description", content: "Managers, staffing and today's takings per branch." },
    ],
  }),
  component: BranchesPage,
});

function BranchesPage() {
  return (
    <AppShell
      title="Branches"
      subtitle={`${branches.length} locations · 36 staff on payroll`}
      actions={
        <Button size="sm" className="rounded-lg">
          Add branch
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {branches.map((b) => (
          <article key={b.name} className="panel min-w-0 p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <h2 className="min-w-0 truncate text-base font-semibold">{b.name}</h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  b.status === "Open" ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {b.status}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">{b.manager}</p>
            <p className="num mt-5 text-xl font-semibold">{currency(b.today)}</p>
            <p className="text-xs text-muted-foreground">Takings today</p>
            <p className="num mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
              {b.staff} staff
            </p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}