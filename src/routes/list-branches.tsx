import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Eye, Pencil, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { branchesData } from "@/lib/branch-data";

export const Route = createFileRoute("/list-branches")({
  head: () => ({
    meta: [
      { title: "Branches — Meridian POS" },
      { name: "description", content: "Manage all registered branches for your business." },
      { property: "og:title", content: "Branches — Meridian POS" },
      { property: "og:description", content: "View, edit and delete branches for your business." },
    ],
  }),
  component: ListBranchesPage,
});

function ListBranchesPage() {
  return (
    <AppShell
      title="Branches"
      subtitle={`${branchesData.length} branches registered`}
      actions={
        <Link to="/create-branch">
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
                <Link to="/branch-view" search={{ id: r.id }}>
                  <Button size="sm" variant="outline" className="h-8 rounded-lg px-2">
                    <Eye className="size-3.5" />
                  </Button>
                </Link>
                <Link to="/branch-edit" search={{ id: r.id }}>
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