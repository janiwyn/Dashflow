import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { businesses } from "@/lib/super-admin-data";

export const Route = createFileRoute("/view-business")({
  validateSearch: z.object({ id: z.number().optional() }),
  head: () => ({
    meta: [
      { title: "Business Details — Super Admin" },
      { name: "description", content: "View full details of a registered business tenant." },
      { property: "og:title", content: "Business Details — Super Admin" },
      { property: "og:description", content: "View full details of a registered business tenant." },
    ],
  }),
  component: ViewBusinessPage,
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <p className="grid grid-cols-[140px_1fr] gap-3 border-b border-border py-2.5 text-sm last:border-0">
      <span className="font-semibold text-muted-foreground">{label}</span>
      <span>{value}</span>
    </p>
  );
}

function ViewBusinessPage() {
  const { id } = Route.useSearch();
  const business = businesses.find((b) => b.id === id);

  return (
    <AppShell title="Business Details" subtitle={business ? business.name : "Not found"}>
      <div className="panel min-w-0 max-w-2xl p-6">
        {business ? (
          <>
            <Row label="Name" value={business.name} />
            <Row label="Admin" value={business.adminName ?? <em className="text-muted-foreground">No admin yet</em>} />
            <Row label="Email" value={business.adminEmail ?? <em className="text-muted-foreground">—</em>} />
            <Row label="Phone" value={business.phone} />
            <Row label="Address" value={business.address} />
            <Row label="Date Registered" value={business.dateRegistered} />
            <Row
              label="Status"
              value={
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    business.status === "active" ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"
                  }`}
                >
                  {business.status === "active" ? "Active" : "Suspended"}
                </span>
              }
            />
            <Button asChild variant="secondary" className="mt-4 rounded-lg">
              <Link to="/manage-business">← Back to List</Link>
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Business not found.</p>
        )}
      </div>
    </AppShell>
  );
}
