import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getBusinessById } from "@/db/queries/super-admin";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Business Details",
  description: "View full details of a registered business tenant.",
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <p className="grid grid-cols-[140px_1fr] gap-3 border-b border-border py-2.5 text-sm last:border-0">
      <span className="font-semibold text-muted-foreground">{label}</span>
      <span>{value}</span>
    </p>
  );
}

export default async function ViewBusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireRole("super");
  const { id } = await searchParams;
  const business = id ? await getBusinessById(Number(id)) : null;

  return (
    <AppShell title="Business Details" subtitle={business ? business.name : "Not found"}>
      <div className="panel min-w-0 max-w-2xl p-6">
        {business ? (
          <>
            <Row label="Name" value={business.name} />
            <Row
              label="Admin"
              value={
                business.adminName ?? <em className="text-muted-foreground">No admin yet</em>
              }
            />
            <Row
              label="Email"
              value={business.adminEmail ?? <em className="text-muted-foreground">—</em>}
            />
            <Row label="Phone" value={business.phone ?? "—"} />
            <Row label="Address" value={business.address ?? "—"} />
            <Row label="Date Registered" value={business.dateRegistered} />
            <Row label="Branches" value={business.branchCount} />
            <Row
              label="Status"
              value={
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    business.status === "active"
                      ? "bg-success/12 text-success"
                      : "bg-destructive/12 text-destructive"
                  }`}
                >
                  {business.status === "active" ? "Active" : "Suspended"}
                </span>
              }
            />
            <Button asChild variant="secondary" className="mt-4 rounded-lg">
              <Link href="/manage-business">← Back to List</Link>
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Business not found.</p>
        )}
      </div>
    </AppShell>
  );
}
