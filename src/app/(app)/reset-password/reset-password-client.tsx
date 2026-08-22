"use client";

import { KeyRound, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";

import { resetUserPassword } from "@/app/actions/users";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { DEFAULT_PASSWORD } from "@/lib/auth-constants";

type Account = {
  id: string;
  username: string;
  role: string;
  branch: string | null;
  business: string | null;
  status: string;
};

export default function ResetPasswordPage({ accounts, showBusiness }: { accounts: Account[]; showBusiness: boolean }) {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [resetIds, setResetIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function reset(user: Account) {
    setNotice("");
    setError("");
    startTransition(async () => {
      const result = await resetUserPassword(user.id);
      if (result.ok) {
        setResetIds((prev) => [...prev, user.id]);
        setNotice(result.message);
      } else {
        setError(result.message);
      }
    });
  }

  const columns: Column<Account>[] = [
    {
      key: "username",
      header: "Username",
      render: (u) => <span className="font-medium">{u.username}</span>,
    },
    { key: "role", header: "Role", render: (u) => <span className="capitalize">{u.role}</span> },
    ...(showBusiness ? [{ key: "business", header: "Business", render: (u: Account) => u.business ?? "—" } as Column<Account>] : []),
    { key: "branch", header: "Branch", render: (u) => u.branch ?? "—" },
    {
      key: "status",
      header: "Status",
      render: (u) => <span className="capitalize text-muted-foreground">{u.status}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (u) => (
        <Button
          size="sm"
          variant="outline"
          className="rounded-lg"
          disabled={pending || resetIds.includes(u.id)}
          onClick={() => reset(u)}
        >
          <RotateCcw className="size-3.5" /> {resetIds.includes(u.id) ? "Reset" : "Reset Password"}
        </Button>
      ),
    },
  ];

  return (
    <AppShell title="Reset Password" subtitle="Restricted to admins and super admins">
      {notice && (
        <div className="panel flex items-center gap-2 border-l-4 border-l-success bg-success/5 p-4 text-sm">
          <KeyRound className="size-4 text-success" /> {notice}
        </div>
      )}
      {error && (
        <div className="panel flex items-center gap-2 border-l-4 border-l-destructive bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      <DataTable
        title="System users"
        description={`Reset a user's password back to the default (${DEFAULT_PASSWORD})`}
        columns={columns}
        rows={accounts}
      />
    </AppShell>
  );
}
