"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Fingerprint,
  KeyRound,
  LogIn,
  LogOut,
  Pencil,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

import {
  clockSelf,
  clockWithPin,
  finishBiometricClockIn,
  finishBiometricEnrollment,
  setEmployeePin,
  startBiometricClockIn,
  startBiometricEnrollment,
  upsertAttendanceRecord,
} from "@/app/actions/attendance";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type {
  getAttendanceHistory,
  getKioskRoster,
  getOwnEmployeeRecord,
  getTodayBoard,
} from "@/db/queries/attendance";

type BoardRow = Awaited<ReturnType<typeof getTodayBoard>>[number];
type HistoryRow = Awaited<ReturnType<typeof getAttendanceHistory>>[number];
type RosterEntry = Awaited<ReturnType<typeof getKioskRoster>>[number];
type OwnEmployee = Awaited<ReturnType<typeof getOwnEmployeeRecord>>;

type Props = {
  board: BoardRow[];
  summary: { total: number; present: number; late: number; notYet: number };
  history: HistoryRow[];
  roster: RosterEntry[];
  ownEmployee: OwnEmployee;
  ownToday: { clockIn: Date | null; clockOut: Date | null } | null;
};

const timeFmt = (d: Date | null) =>
  d ? new Date(d).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false }) : "—";

const METHOD_LABEL: Record<string, string> = { self: "Self", pin: "PIN", biometric: "Biometric", manual: "Manual" };

const STATUS_STYLE: Record<BoardRow["status"], string> = {
  present: "bg-success/12 text-success",
  late: "bg-warning/15 text-warning-foreground",
  absent: "bg-destructive/12 text-destructive",
  not_yet: "bg-muted text-muted-foreground",
};
const STATUS_LABEL: Record<BoardRow["status"], string> = {
  present: "On time",
  late: "Late",
  absent: "Absent",
  not_yet: "Not yet in",
};

function StatusBadge({ status }: { status: BoardRow["status"] }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export default function AttendancePage({ board, summary, history, roster, ownEmployee, ownToday }: Props) {
  const router = useRouter();

  return (
    <AppShell title="Attendance" subtitle={`${summary.present + summary.late} of ${summary.total} clocked in today`}>
      <MyAttendanceCard ownEmployee={ownEmployee} ownToday={ownToday} onDone={() => router.refresh()} />

      <section className="grid gap-4 sm:grid-cols-4">
        <StatCard label="On time" value={String(summary.present)} icon={UserCheck} hint="clocked in before 9am" />
        <StatCard label="Late" value={String(summary.late)} icon={Clock} hint="clocked in after 9am" />
        <StatCard label="Not yet in" value={String(summary.notYet)} icon={UserX} hint="of today's roster" />
        <StatCard label="Active roster" value={String(summary.total)} icon={Users} hint="employees tracked" />
      </section>

      <Tabs defaultValue="board" className="w-full">
        <TabsList>
          <TabsTrigger value="board">Today&apos;s board</TabsTrigger>
          <TabsTrigger value="kiosk">Team check-in</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <BoardTab board={board} onDone={() => router.refresh()} />
        </TabsContent>
        <TabsContent value="kiosk">
          <KioskTab roster={roster} onDone={() => router.refresh()} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab history={history} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

/* ---------------------------------------------------------- My attendance */

function MyAttendanceCard({
  ownEmployee,
  ownToday,
  onDone,
}: {
  ownEmployee: OwnEmployee;
  ownToday: { clockIn: Date | null; clockOut: Date | null } | null;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [enrolling, setEnrolling] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);

  useEffect(() => {
    if (!browserSupportsWebAuthn()) return;
    platformAuthenticatorIsAvailable().then(setBioSupported);
  }, []);

  if (!ownEmployee) {
    return (
      <div className="panel flex items-start gap-3 border-l-4 border-l-warning p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
        <p className="text-sm text-muted-foreground">
          Your account isn&apos;t linked to an employee record, so there&apos;s nothing here to clock in or
          out — ask a manager to link it from Employees.
        </p>
      </div>
    );
  }

  const clockedIn = Boolean(ownToday?.clockIn);
  const clockedOut = Boolean(ownToday?.clockOut);
  const done = clockedIn && clockedOut;

  const clock = () => {
    startTransition(async () => {
      const result = await clockSelf();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      onDone();
    });
  };

  const enroll = async () => {
    setEnrolling(true);
    try {
      const start = await startBiometricEnrollment(ownEmployee.id);
      if (!start.ok) throw new Error("message" in start ? start.message : "Could not start enrollment.");
      const response = await startRegistration({ optionsJSON: start.options });
      const result = await finishBiometricEnrollment(ownEmployee.id, response, navigator.userAgent.slice(0, 60));
      if (!result.ok) throw new Error(result.message);
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not register this device.");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="panel flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p className="text-sm text-muted-foreground">Your attendance today</p>
        <p className="mt-1 text-lg font-semibold">
          {done
            ? `In ${timeFmt(ownToday!.clockIn)} · Out ${timeFmt(ownToday!.clockOut)}`
            : clockedIn
              ? `Clocked in at ${timeFmt(ownToday!.clockIn)}`
              : "Not clocked in yet"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {bioSupported && (
          <Button variant="outline" className="rounded-lg" onClick={enroll} disabled={enrolling}>
            <Fingerprint className="size-4" /> {enrolling ? "Registering…" : "Register biometric on this device"}
          </Button>
        )}
        <Button className="rounded-lg" onClick={clock} disabled={pending || done}>
          {clockedIn ? <LogOut className="size-4" /> : <LogIn className="size-4" />}
          {done ? "Done for today" : pending ? "Saving…" : clockedIn ? "Clock out" : "Clock in"}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Board tab */

function BoardTab({ board, onDone }: { board: BoardRow[]; onDone: () => void }) {
  const columns: Column<BoardRow>[] = [
    { key: "name", header: "Employee", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "position", header: "Position", render: (r) => <span className="text-muted-foreground">{r.position}</span> },
    { key: "branch", header: "Branch", render: (r) => <span className="text-muted-foreground">{r.branch ?? "—"}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "in",
      header: "Clock in",
      render: (r) => (
        <span className="num">
          {timeFmt(r.clockIn)} {r.clockInMethod && <span className="text-xs text-muted-foreground">({METHOD_LABEL[r.clockInMethod]})</span>}
        </span>
      ),
    },
    {
      key: "out",
      header: "Clock out",
      render: (r) => (
        <span className="num">
          {timeFmt(r.clockOut)} {r.clockOutMethod && <span className="text-xs text-muted-foreground">({METHOD_LABEL[r.clockOutMethod]})</span>}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Setup",
      align: "right",
      render: (r) => <ManageEmployeeDialog employee={r} onDone={onDone} />,
    },
  ];

  return <DataTable title="Today's board" description={`${board.length} active employees`} columns={columns} rows={board} minWidth={860} />;
}

function ManageEmployeeDialog({ employee, onDone }: { employee: BoardRow; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [savingPin, startSavingPin] = useTransition();
  const [enrolling, setEnrolling] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [note, setNote] = useState("");
  const [savingRecord, startSavingRecord] = useTransition();

  useEffect(() => {
    if (!browserSupportsWebAuthn()) return;
    platformAuthenticatorIsAvailable().then(setBioSupported);
  }, []);

  const savePin = () => {
    if (!/^\d{4,6}$/.test(pin)) {
      toast.error("PIN must be 4–6 digits.");
      return;
    }
    startSavingPin(async () => {
      const result = await setEmployeePin(employee.employeeId, pin);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setPin("");
      onDone();
    });
  };

  const enroll = async () => {
    setEnrolling(true);
    try {
      const start = await startBiometricEnrollment(employee.employeeId);
      if (!start.ok) throw new Error("message" in start ? start.message : "Could not start enrollment.");
      const response = await startRegistration({ optionsJSON: start.options });
      const result = await finishBiometricEnrollment(employee.employeeId, response, "Kiosk device");
      if (!result.ok) throw new Error(result.message);
      toast.success(result.message);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not register this device.");
    } finally {
      setEnrolling(false);
    }
  };

  const saveRecord = () => {
    startSavingRecord(async () => {
      const result = await upsertAttendanceRecord({
        employeeId: employee.employeeId,
        date,
        clockIn: clockIn || null,
        clockOut: clockOut || null,
        note,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      onDone();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-lg">
          <Pencil className="size-3.5" /> Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{employee.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <KeyRound className="size-3.5" /> Kiosk PIN {employee.hasPin && <CheckCircle2 className="size-3.5 text-success" />}
            </p>
            <div className="flex gap-2">
              <Input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="4–6 digits"
                className="h-9"
              />
              <Button size="sm" className="h-9 shrink-0 rounded-lg" onClick={savePin} disabled={savingPin}>
                {employee.hasPin ? "Reset" : "Set"}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <Fingerprint className="size-3.5" /> Biometric {employee.hasBiometric && <CheckCircle2 className="size-3.5 text-success" />}
            </p>
            {bioSupported ? (
              <Button size="sm" variant="outline" className="h-9 rounded-lg" onClick={enroll} disabled={enrolling}>
                {enrolling ? "Registering…" : employee.hasBiometric ? "Register another device" : "Register on this device"}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                This device has no fingerprint/face sensor available to the browser.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Manual correction
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Clock in</Label>
                <Input type="time" value={clockIn} onChange={(e) => setClockIn(e.target.value)} className="h-9" />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Clock out</Label>
                <Input type="time" value={clockOut} onChange={(e) => setClockOut(e.target.value)} className="h-9" />
              </div>
            </div>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason (optional) — e.g. forgot to tap out"
              className="mt-2 h-9"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={saveRecord} disabled={savingRecord} className="rounded-lg">
            {savingRecord ? "Saving…" : "Save correction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- Kiosk tab */

function KioskTab({ roster, onDone }: { roster: RosterEntry[]; onDone: () => void }) {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [pin, setPin] = useState("");
  const [pinPending, startPinTransition] = useTransition();
  const [bioSupported, setBioSupported] = useState(false);
  const [bioPending, setBioPending] = useState(false);

  useEffect(() => {
    if (!browserSupportsWebAuthn()) return;
    platformAuthenticatorIsAvailable().then(setBioSupported);
  }, []);

  const pinEligible = roster.filter((r) => r.hasPin);

  const submitPin = () => {
    if (!employeeId || !/^\d{4,6}$/.test(pin)) {
      toast.error("Choose your name and enter your PIN.");
      return;
    }
    startPinTransition(async () => {
      const result = await clockWithPin(Number(employeeId), pin);
      setPin("");
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      onDone();
    });
  };

  const tapBiometric = async () => {
    setBioPending(true);
    try {
      const start = await startBiometricClockIn();
      const response = await startAuthentication({ optionsJSON: start.options });
      const result = await finishBiometricClockIn(response);
      if (!result.ok) throw new Error(result.message);
      toast.success(result.message);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not verify — try the PIN instead.");
    } finally {
      setBioPending(false);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="panel p-5">
        <h3 className="mb-1 flex items-center gap-2 text-base font-semibold">
          <Fingerprint className="size-4" /> Biometric tap
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          For a shared device with a fingerprint or face sensor. Works for anyone already enrolled on this
          device — no need to pick a name first.
        </p>
        {bioSupported ? (
          <Button className="w-full rounded-lg" onClick={tapBiometric} disabled={bioPending}>
            <Fingerprint className="size-4" /> {bioPending ? "Verifying…" : "Tap sensor to clock in / out"}
          </Button>
        ) : (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            This device doesn&apos;t expose a biometric sensor to the browser — use the PIN pad instead, or a
            phone/laptop with Windows Hello, Touch ID or an Android fingerprint reader.
          </p>
        )}
      </div>

      <div className="panel p-5">
        <h3 className="mb-1 flex items-center gap-2 text-base font-semibold">
          <KeyRound className="size-4" /> PIN pad
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Always available, no hardware required — pick your name and enter your PIN.
        </p>
        <div className="grid gap-2">
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Select your name" /></SelectTrigger>
            <SelectContent>
              {pinEligible.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">No one has a PIN set yet.</div>
              )}
              {pinEligible.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="PIN"
            type="password"
            inputMode="numeric"
            className="h-10"
          />
          <Button className="rounded-lg" onClick={submitPin} disabled={pinPending}>
            {pinPending ? "Checking…" : "Clock in / out"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ History tab */

function HistoryTab({ history }: { history: HistoryRow[] }) {
  const [employee, setEmployee] = useState("All");
  const names = useMemo(() => ["All", ...Array.from(new Set(history.map((h) => h.employeeName)))], [history]);
  const filtered = useMemo(
    () => (employee === "All" ? history : history.filter((h) => h.employeeName === employee)),
    [history, employee],
  );

  const columns: Column<HistoryRow>[] = [
    { key: "date", header: "Date", render: (r) => <span className="num text-muted-foreground">{r.date}</span> },
    { key: "employeeName", header: "Employee", render: (r) => <span className="font-medium">{r.employeeName}</span> },
    { key: "branch", header: "Branch", render: (r) => <span className="text-muted-foreground">{r.branch ?? "—"}</span> },
    {
      key: "in",
      header: "Clock in",
      render: (r) => (
        <span className="num">
          {timeFmt(r.clockIn)} {r.clockInMethod && <span className="text-xs text-muted-foreground">({METHOD_LABEL[r.clockInMethod]})</span>}
        </span>
      ),
    },
    {
      key: "out",
      header: "Clock out",
      render: (r) => (
        <span className="num">
          {timeFmt(r.clockOut)} {r.clockOutMethod && <span className="text-xs text-muted-foreground">({METHOD_LABEL[r.clockOutMethod]})</span>}
        </span>
      ),
    },
    { key: "hours", header: "Hours", align: "right", render: (r) => <span className="num">{r.hoursWorked ?? "—"}</span> },
    { key: "note", header: "Note", render: (r) => <span className="text-xs text-muted-foreground">{r.note ?? ""}</span> },
  ];

  return (
    <DataTable
      title="History"
      description={`${filtered.length} records`}
      columns={columns}
      rows={filtered}
      minWidth={900}
      toolbar={
        <Select value={employee} onValueChange={setEmployee}>
          <SelectTrigger className="h-9 w-44 rounded-lg text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {names.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    />
  );
}
