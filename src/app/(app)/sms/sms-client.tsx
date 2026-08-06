"use client";

import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SmsLog } from "@/db/queries/views";
import type { viewSmsLogs } from "@/db/queries/views";

type Props = {
  smsLogs: Awaited<ReturnType<typeof viewSmsLogs>>;
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

export default function SmsPage({ smsLogs }: Props) {
  const [logs, setLogs] = useState(smsLogs);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  function send() {
    if (!phone || !message) return;
    setLogs((prev) => [
      { id: prev.length + 1, recipient: phone, message, status: "sent", sentAt: "Just now" },
      ...prev,
    ]);
    setPhone("");
    setMessage("");
  }

  const sent = logs.filter((l) => l.status === "sent").length;
  const failed = logs.filter((l) => l.status === "failed").length;

  return (
    <AppShell title="SMS alerts" subtitle="Send batch messages via the Aliesms gateway">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Sent" value={String(sent)} icon={MessageSquare} hint="this week" />
        <StatCard label="Failed" value={String(failed)} icon={Send} hint="needs retry" />
        <StatCard label="Queued" value={String(logs.filter((l) => l.status === "queued").length)} icon={MessageSquare} hint="pending dispatch" />
      </section>

      <section className="panel grid gap-3 p-5 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Recipient</label>
          <Input placeholder="07xx xxx xxx" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg" />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Message</label>
          <Textarea placeholder="Message text" value={message} onChange={(e) => setMessage(e.target.value)} className="rounded-lg" />
        </div>
        <Button className="rounded-lg" onClick={send}>
          <Send className="size-4" /> Send SMS
        </Button>
      </section>

      <DataTable title="Delivery log" description="Most recent first" columns={columns} rows={logs} />
    </AppShell>
  );
}
