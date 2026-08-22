"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DatabaseBackup,
  FileArchive,
  ScrollText,
  Trash2,
  UploadCloud,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { clearAppCache, clearSystemLogs, logDatabaseBackup, logSystemUpdate } from "@/app/actions/super-admin";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SystemLogEntry, SystemUpdateEntry } from "@/db/queries/views";

type Props = {
  logs: SystemLogEntry[];
  updates: SystemUpdateEntry[];
};

function isBackup(fileName: string) {
  return fileName.startsWith("db_backup_");
}

function ActionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel min-w-0 p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** Picks an icon for a log line based on the action it describes, so the audit trail scans visually instead of reading as a flat text list. */
function logIcon(message: string): LucideIcon {
  if (message.includes("backup")) return DatabaseBackup;
  if (message.includes("Uploaded")) return UploadCloud;
  if (message.includes("Cleared system logs")) return Trash2;
  if (message.includes("cache")) return Zap;
  return ScrollText;
}

export default function SystemUpdatesPage({ logs: seedLogs, updates: seedUpdates }: Props) {
  const router = useRouter();
  const [logs, setLogs] = useState(seedLogs);
  const [updates, setUpdates] = useState(seedUpdates);
  const [fileName, setFileName] = useState("");

  // router.refresh() re-fetches the seed props on the server, but a client
  // component's useState only reads its initial value once — without this,
  // a real upload/backup would write to the DB but these lists would sit
  // there unchanged until a full page reload.
  useEffect(() => setLogs(seedLogs), [seedLogs]);
  useEffect(() => setUpdates(seedUpdates), [seedUpdates]);

  const [uploading, startUpload] = useTransition();
  const [backingUp, startBackup] = useTransition();
  const [clearingLogs, startClearLogs] = useTransition();
  const [clearingCache, startClearCache] = useTransition();

  const refresh = () => router.refresh();

  const stats = useMemo(() => {
    const backups = updates.filter((u) => isBackup(u.fileName)).length;
    const patches = updates.length - backups;
    const lastBackup = updates.find((u) => isBackup(u.fileName));
    return { patches, backups, lastBackup: lastBackup?.date ?? "—", logCount: logs.length };
  }, [updates, logs]);

  const upload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) {
      toast.error("Choose an update file first");
      return;
    }
    startUpload(async () => {
      const result = await logSystemUpdate(fileName);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setFileName("");
      refresh();
    });
  };

  const backup = () => {
    startBackup(async () => {
      const result = await logDatabaseBackup();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      refresh();
    });
  };

  const handleClearLogs = () => {
    startClearLogs(async () => {
      const result = await clearSystemLogs();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setLogs([]);
      toast.success(result.message);
    });
  };

  const handleClearCache = () => {
    startClearCache(async () => {
      const result = await clearAppCache();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      refresh();
    });
  };

  const updateColumns: Column<SystemUpdateEntry>[] = [
    {
      key: "type",
      header: "Type",
      render: (u) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isBackup(u.fileName) ? "bg-primary/12 text-primary" : "bg-accent text-accent-foreground"
          }`}
        >
          {isBackup(u.fileName) ? <DatabaseBackup className="size-3" /> : <FileArchive className="size-3" />}
          {isBackup(u.fileName) ? "Backup" : "Update"}
        </span>
      ),
    },
    { key: "file", header: "File", render: (u) => <span className="num block max-w-[220px] truncate font-medium">{u.fileName}</span> },
    { key: "notes", header: "Notes", render: (u) => <span className="block max-w-[220px] truncate text-muted-foreground">{u.notes ?? "—"}</span> },
    {
      key: "date",
      header: "Date",
      render: (u) => (
        <span className="num whitespace-nowrap text-muted-foreground">
          {u.date} <span className="text-xs">{u.time}</span>
        </span>
      ),
    },
  ];

  return (
    <AppShell title="System Updates & Maintenance" subtitle="Upload patches, back up data and monitor the platform audit log">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Update Files" value={String(stats.patches)} icon={FileArchive} hint="patches uploaded" />
        <StatCard label="Database Backups" value={String(stats.backups)} icon={DatabaseBackup} hint="snapshots taken" />
        <StatCard label="Last Backup" value={stats.lastBackup} icon={ScrollText} hint="most recent snapshot" />
        <StatCard label="Audit Log Entries" value={String(stats.logCount)} icon={ScrollText} hint="actions recorded" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ActionCard icon={UploadCloud} title="Upload New System Update">
          <form onSubmit={upload} className="flex flex-col gap-2">
            <Input
              type="file"
              className="h-9 text-xs"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
            <Button type="submit" size="sm" disabled={uploading} className="rounded-lg">
              {uploading ? "Uploading…" : "Upload Update"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Records the file name in the audit log — there&apos;s no file storage wired up yet.
            </p>
          </form>
        </ActionCard>

        <ActionCard icon={DatabaseBackup} title="Backup Database">
          <Button size="sm" disabled={backingUp} className="w-full rounded-lg" onClick={backup}>
            {backingUp ? "Backing up…" : "Create Backup"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Logs a real backup record — an actual pg_dump isn&apos;t wired up yet.
          </p>
        </ActionCard>

        <ActionCard icon={Trash2} title="Clear System Logs">
          <Button size="sm" variant="secondary" disabled={clearingLogs} className="w-full rounded-lg" onClick={handleClearLogs}>
            {clearingLogs ? "Clearing…" : "Clear Logs"}
          </Button>
        </ActionCard>

        <ActionCard icon={Zap} title="Clear Cache">
          <Button size="sm" variant="secondary" disabled={clearingCache} className="w-full rounded-lg" onClick={handleClearCache}>
            {clearingCache ? "Clearing…" : "Clear Cache"}
          </Button>
        </ActionCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <DataTable
          title="Update history"
          description={`${updates.length} recorded update${updates.length === 1 ? "" : "s"}`}
          columns={updateColumns}
          rows={updates}
          minWidth={720}
        />

        <div className="panel min-w-0 p-5">
          <div className="flex items-center gap-2">
            <ScrollText className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Audit log</h2>
          </div>
          {logs.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No logs available.</p>
          ) : (
            <ul className="mt-4 max-h-[420px] divide-y divide-border overflow-y-auto">
              {logs.map((l) => {
                const Icon = logIcon(l.message);
                return (
                  <li key={l.id} className="flex items-start gap-3 py-3">
                    <div className="grid size-7 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{l.message}</p>
                      <p className="num mt-0.5 truncate text-xs text-muted-foreground">
                        {l.actor} · {l.date}, {l.time}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </AppShell>
  );
}
