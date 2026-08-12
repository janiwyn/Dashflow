"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, MessageSquare, Send, Wallet } from "lucide-react";

import { sendSmsAlert } from "@/app/actions/sms";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BalanceResult } from "@/lib/aliesms";
import type { SmsLog } from "@/db/queries/views";
import type { viewSmsLogs } from "@/db/queries/views";

type Props = {
  smsLogs: Awaited<ReturnType<typeof viewSmsLogs>>;
  configured: boolean;
  balance: BalanceResult | null;
};

function StatusPill({ status }: { status: SmsLog["status"] }) {
  const styles: Record<SmsLog["status"], string> = {
    sent: "bg-success/12 text-success",
    queued: "bg-warning/15 text-warning-foreground",
    failed: "bg-destructive/12 text-destructive",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>{status}</span>;
}

const columns: Column<SmsLog>[] = [
  { key: "recipient", header: "Recipient", render: (r) => <span className="num">{r.recipient}</span> },
  { key: "message", header: "Message", render: (r) => <span className="line-clamp-1 max-w-md text-muted-foreground">{r.message}</span> },
  { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
  { key: "sentAt", header: "Sent at", align: "right", render: (r) => <span className="num text-muted-foreground">{r.sentAt}</span> },
];

export default function SmsPage({ smsLogs, configured, balance }: Props) {
  const router = useRouter();
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState("");
  const [sending, startSending] = useTransition();

  const sent = smsLogs.filter((l) => l.status === "sent").length;
  const failed = smsLogs.filter((l) => l.status === "failed").length;
  const queued = smsLogs.filter((l) => l.status === "queued").length;

  const send = () => {
    const list = recipients.split(/[,\n]/).map((r) => r.trim()).filter(Boolean);
    if (list.length === 0 || !message.trim()) return;

    startSending(async () => {
      const result = await sendSmsAlert({ recipients: list, message });
      if (!result.ok) {
        toast.error(result.message);
        router.refresh();
        return;
      }
      toast.success(result.message);
      setRecipients("");
      setMessage("");
      router.refresh();
    });
  };

  return (
    <AppShell title="SMS alerts" subtitle="Send batch messages via the AlieSMS gateway">
      {!configured && (
        <div className="panel flex items-start gap-3 border-l-4 border-l-warning p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
          <p className="text-sm text-muted-foreground">
            AlieSMS isn&apos;t connected yet — messages will be logged as failed until an administrator adds{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">ALIESMS_EMAIL</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">ALIESMS_PASSWORD</code>.
          </p>
        </div>
      )}
      {configured && balance && !balance.ok && (
        <div className="panel flex items-start gap-3 border-l-4 border-l-destructive p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-sm text-muted-foreground">Couldn&apos;t reach AlieSMS: {balance.error}</p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Sent" value={String(sent)} icon={MessageSquare} hint="all time" />
        <StatCard label="Failed" value={String(failed)} icon={Send} hint="needs retry" />
        <StatCard label="Queued" value={String(queued)} icon={MessageSquare} hint="pending dispatch" />
        <StatCard
          label="AlieSMS balance"
          value={balance?.ok ? `${balance.currency} ${balance.balance.toLocaleString()}` : "—"}
          icon={Wallet}
          hint={configured ? "account balance" : "not connected"}
        />
      </section>

      <section className="panel grid gap-3 p-5 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Recipient(s)
          </label>
          <Input
            placeholder="07xx xxx xxx, 07xx xxx xxx"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            className="rounded-lg"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Message</label>
          <Textarea placeholder="Message text" value={message} onChange={(e) => setMessage(e.target.value)} className="rounded-lg" />
        </div>
        <Button className="rounded-lg" onClick={send} disabled={sending}>
          <Send className="size-4" /> {sending ? "Sending…" : "Send SMS"}
        </Button>
      </section>

      <DataTable title="Delivery log" description="Most recent first" columns={columns} rows={smsLogs} />
    </AppShell>
  );
}
