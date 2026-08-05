import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, RotateCcw } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { userAccounts as initialAccounts, type SystemUserAccount } from "@/lib/hr-data";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Meridian POS" },
      { name: "description", content: "Reset a system user's password to the default and notify them." },
      { property: "og:title", content: "Reset Password — Meridian POS" },
      { property: "og:description", content: "Reset a system user's password to the default and notify them." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [accounts] = useState(initialAccounts);
  const [notice, setNotice] = useState("");
  const [resetIds, setResetIds] = useState<number[]>([]);

  function reset(user: SystemUserAccount) {
    setResetIds((prev) => [...prev, user.id]);
    setNotice(`Password reset to default (123456) for ${user.username}.`);
  }

  const columns: Column<SystemUserAccount>[] = [
    { key: "username", header: "Username", render: (u) => <span className="font-medium">{u.username}</span> },
    { key: "role", header: "Role", render: (u) => <span className="capitalize">{u.role}</span> },
    { key: "branch", header: "Branch", render: (u) => u.branch ?? "—" },
    { key: "status", header: "Status", render: (u) => <span className="text-muted-foreground">{u.status}</span> },
    {
      key: "actions", header: "", align: "right",
      render: (u) => (
        <Button
          size="sm"
          variant="outline"
          className="rounded-lg"
          disabled={resetIds.includes(u.id)}
          onClick={() => reset(u)}
        >
          <RotateCcw className="size-3.5" /> {resetIds.includes(u.id) ? "Reset" : "Reset Password"}
        </Button>
      ),
    },
  ];

  return (
    <AppShell title="Reset Password" subtitle="Restricted to super admins">
      {notice && (
        <div className="panel flex items-center gap-2 border-l-4 border-l-success bg-success/5 p-4 text-sm">
          <KeyRound className="size-4 text-success" /> {notice}
        </div>
      )}
      <DataTable
        title="System users"
        description="Reset a user's password back to the default (123456)"
        columns={columns}
        rows={accounts}
      />
    </AppShell>
  );
}