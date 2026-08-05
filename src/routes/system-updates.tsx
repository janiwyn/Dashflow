import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { UploadCloud, DatabaseBackup, Trash2, Zap, ScrollText } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { systemLogs as seed } from "@/lib/super-admin-data";

export const Route = createFileRoute("/system-updates")({
  head: () => ({
    meta: [
      { title: "System Updates & Maintenance — Super Admin" },
      { name: "description", content: "Upload patches, back up the database, clear logs and cache, and review the audit log." },
      { property: "og:title", content: "System Updates & Maintenance — Super Admin" },
      { property: "og:description", content: "Upload patches, back up the database and review the system audit log." },
    ],
  }),
  component: SystemUpdatesPage,
});

function ActionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel min-w-0 p-5">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function SystemUpdatesPage() {
  const [logs, setLogs] = useState<string[]>(seed);
  const [fileName, setFileName] = useState("");

  const log = (msg: string) => setLogs((prev) => [`${new Date().toISOString().slice(0, 19).replace("T", " ")} - [Super Admin] ${msg}`, ...prev]);

  const upload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) {
      toast.error("Choose an update file first");
      return;
    }
    toast.success("Update file uploaded successfully!");
    log(`Uploaded update file: ${fileName}`);
    setFileName("");
  };

  const backup = () => {
    const stamp = new Date().toISOString().replace(/[-:T]/g, "_").slice(0, 19);
    toast.success("Database backup created successfully");
    log(`Created database backup: db_backup_${stamp}.sql`);
  };

  const clearLogs = () => {
    setLogs([]);
    toast.success("System logs cleared successfully!");
  };

  const clearCache = () => {
    toast.success("Cache cleared successfully! (Demo mode)");
    log("Cleared cache");
  };

  return (
    <AppShell title="System Updates & Maintenance" subtitle="Upload patches, back up data and monitor the audit log">
      <div className="grid gap-4 sm:grid-cols-2">
        <ActionCard icon={UploadCloud} title="Upload New System Update">
          <form onSubmit={upload} className="flex flex-wrap items-center gap-2">
            <Input
              type="file"
              className="h-9 max-w-xs text-xs"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
            <Button type="submit" size="sm" className="rounded-lg">Upload Update</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">You can upload a .zip update or SQL file to patch the system.</p>
        </ActionCard>

        <ActionCard icon={DatabaseBackup} title="Backup Database">
          <Button size="sm" className="rounded-lg" onClick={backup}>Create Backup</Button>
        </ActionCard>

        <ActionCard icon={Trash2} title="Clear System Logs">
          <Button size="sm" variant="secondary" className="rounded-lg" onClick={clearLogs}>Clear Logs</Button>
        </ActionCard>

        <ActionCard icon={Zap} title="Clear Cache">
          <Button size="sm" variant="secondary" className="rounded-lg" onClick={clearCache}>Clear Cache</Button>
        </ActionCard>
      </div>

      <section className="panel min-w-0 p-5">
        <div className="flex items-center gap-2">
          <ScrollText className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">View System Logs</h2>
        </div>
        <pre className="num mt-3 h-72 overflow-y-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
          {logs.length ? logs.join("\n") : "No logs available."}
        </pre>
      </section>
    </AppShell>
  );
}