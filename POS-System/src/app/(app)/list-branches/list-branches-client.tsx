"use client";

import type { viewBranches } from "@/db/queries/views";
import { Building2, Eye, Pencil, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";


type Props = {
  branchesData: Awaited<ReturnType<typeof viewBranches>>;
};

export default function ListBranchesPage({ branchesData }: Props) {
  return (
    <AppShell
      title="Branches"
      subtitle={`${branchesData.length} branches registered`}
      actions={
        <Link href="/create-branch">
          <Button size="sm" className="rounded-lg">
            <Building2 className="size-4" /> Add branch
          </Button>
        </Link>
      }
    >
      <DataTable
        title="All branches"
        description="Branches registered under your business"
        columns={[
          { key: "id", header: "#", render: (r) => <span className="num text-muted-foreground">{r.id}</span> },
          { key: "name", header: "Branch name", render: (r) => <span className="font-medium">{r.name}</span> },
          { key: "location", header: "Location", render: (r) => r.location },
          {
            key: "manager",
            header: "Manager",
            render: (r) => r.manager ?? <span className="text-muted-foreground">No manager</span>,
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (r) => (
              <div className="flex justify-end gap-2">
                <Link href={`/branch-view?id=${r.id}`}>
                  <Button size="sm" variant="outline" className="h-8 rounded-lg px-2">
                    <Eye className="size-3.5" />
                  </Button>
                </Link>
                <Link href={`/branch-edit?id=${r.id}`}>
                  <Button size="sm" variant="outline" className="h-8 rounded-lg px-2">
                    <Pencil className="size-3.5" />
                  </Button>
                </Link>
                <Button size="sm" variant="outline" className="h-8 rounded-lg px-2 text-destructive hover:text-destructive">
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ),
          },
        ]}
        rows={branchesData}
      />
    </AppShell>
  );
}
