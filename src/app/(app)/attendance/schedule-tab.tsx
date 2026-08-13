"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Clock3, Pencil, Plus, Trash2 } from "lucide-react";

import {
  assignShift,
  clearAssignment,
  createShift,
  deleteShift,
  fetchShifts,
  fetchWeekSchedule,
  updateShift,
} from "@/app/actions/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { getShifts, getWeekSchedule } from "@/db/queries/schedule";

type Shift = Awaited<ReturnType<typeof getShifts>>[number];
type WeekSchedule = Awaited<ReturnType<typeof getWeekSchedule>>;
type ScheduleCell = WeekSchedule["rows"][number]["days"][string];

type Props = {
  initial: WeekSchedule;
  initialShifts: Shift[];
  branches: { id: number; name: string }[];
  showBranchPicker: boolean;
  defaultBranchId: number | null;
  canManage: boolean;
};

const DAY_LABEL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const fmtTime = (t: string) => t.slice(0, 5);
const fmtDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-KE", { month: "short", day: "numeric" });

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ScheduleTab({ initial, initialShifts, branches, showBranchPicker, defaultBranchId, canManage }: Props) {
  const [weekStart, setWeekStart] = useState(() => addDays(initial.dates[0], 0));
  const [branchId, setBranchId] = useState<number | null>(defaultBranchId);
  const [schedule, setSchedule] = useState(initial);
  const [shiftsList, setShiftsList] = useState(initialShifts);
  const [loading, startLoading] = useTransition();

  const reload = (nextWeekStart: string, nextBranchId: number | null) => {
    startLoading(async () => {
      const [week, shifts] = await Promise.all([
        fetchWeekSchedule({ branchId: nextBranchId ?? undefined, weekStart: nextWeekStart }),
        fetchShifts(nextBranchId ?? undefined),
      ]);
      setSchedule(week);
      setShiftsList(shifts);
    });
  };

  const goWeek = (delta: number) => {
    const next = addDays(weekStart, delta * 7);
    setWeekStart(next);
    reload(next, branchId);
  };

  const changeBranch = (id: number) => {
    setBranchId(id);
    reload(weekStart, id);
  };

  const refreshCurrent = () => reload(weekStart, branchId);

  if (!canManage) {
    return <MyScheduleList schedule={schedule} onPrev={() => goWeek(-1)} onNext={() => goWeek(1)} loading={loading} />;
  }

  return (
    <div className="grid gap-4">
      <ShiftTemplates
        shifts={shiftsList}
        branchId={branchId}
        branches={branches}
        showBranchPicker={showBranchPicker}
        onBranchChange={changeBranch}
        onChanged={refreshCurrent}
      />

      <div className="panel min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Weekly schedule</h2>
            <p className="text-sm text-muted-foreground">
              {fmtDate(schedule.dates[0])} – {fmtDate(schedule.dates[6])}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="size-8 rounded-lg" onClick={() => goWeek(-1)} disabled={loading}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8 rounded-lg" onClick={() => goWeek(1)} disabled={loading}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 920 }}>
            <thead>
              <tr className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                <th className="px-5 py-3 text-left font-semibold">Employee</th>
                {schedule.dates.map((d, i) => (
                  <th key={d} className="px-2 py-3 text-center font-semibold">
                    {DAY_LABEL[i]}
                    <div className="num font-normal normal-case text-muted-foreground/80">{fmtDate(d)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedule.rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No employees to schedule in this branch yet.
                  </td>
                </tr>
              )}
              {schedule.rows.map((row) => (
                <tr key={row.employeeId}>
                  <td className="px-5 py-2.5 font-medium">{row.employeeName}</td>
                  {schedule.dates.map((d) => (
                    <td key={d} className="px-2 py-2.5 text-center">
                      <AssignCell
                        employeeId={row.employeeId}
                        date={d}
                        cell={row.days[d]}
                        shifts={shiftsList}
                        onChanged={refreshCurrent}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Cell popover */

function AssignCell({
  employeeId,
  date,
  cell,
  shifts,
  onChanged,
}: {
  employeeId: number;
  date: string;
  cell: ScheduleCell;
  shifts: Shift[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [shiftId, setShiftId] = useState(cell ? String(cell.shiftId) : "");
  const [pending, startTransition] = useTransition();

  const save = () => {
    if (!shiftId) {
      toast.error("Choose a shift.");
      return;
    }
    startTransition(async () => {
      const result = await assignShift({ employeeId, shiftId: Number(shiftId), date });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      onChanged();
    });
  };

  const clear = () => {
    startTransition(async () => {
      const result = await clearAssignment({ employeeId, date });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setOpen(false);
      onChanged();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setShiftId(cell ? String(cell.shiftId) : ""); }}>
      <DialogTrigger asChild>
        <button
          className={`w-full rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
            cell
              ? "border-primary/30 bg-accent text-foreground hover:border-primary"
              : "border-dashed border-border text-muted-foreground hover:border-primary hover:text-foreground"
          }`}
        >
          {cell ? (
            <>
              {cell.shiftName}
              <div className="num text-[0.68rem] text-muted-foreground">
                {fmtTime(cell.startTime)}–{fmtTime(cell.endTime)}
              </div>
            </>
          ) : (
            "+"
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Assign shift</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Select value={shiftId} onValueChange={setShiftId}>
            <SelectTrigger><SelectValue placeholder="Choose a shift" /></SelectTrigger>
            <SelectContent>
              {shifts.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">No shifts yet — add one first.</div>}
              {shifts.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name} · {fmtTime(s.startTime)}–{fmtTime(s.endTime)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {cell && (
            <Button type="button" variant="ghost" className="text-destructive" onClick={clear} disabled={pending}>
              Clear
            </Button>
          )}
          <Button type="button" onClick={save} disabled={pending} className="ml-auto rounded-lg">
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------------------------------- Shift templates */

function ShiftTemplates({
  shifts,
  branchId,
  branches,
  showBranchPicker,
  onBranchChange,
  onChanged,
}: {
  shifts: Shift[];
  branchId: number | null;
  branches: { id: number; name: string }[];
  showBranchPicker: boolean;
  onBranchChange: (id: number) => void;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [pending, startTransition] = useTransition();

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (s: Shift) => { setEditing(s); setOpen(true); };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "");
    const startTime = String(fd.get("start_time") || "");
    const endTime = String(fd.get("end_time") || "");

    startTransition(async () => {
      const result = editing
        ? await updateShift({ id: editing.id, name, startTime, endTime })
        : branchId
          ? await createShift({ name, branchId, startTime, endTime })
          : { ok: false as const, message: "Choose a branch first." };
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      onChanged();
    });
  };

  const remove = (id: number) => {
    startTransition(async () => {
      const result = await deleteShift(id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      onChanged();
    });
  };

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Shift templates</h2>
          <p className="text-sm text-muted-foreground">Define the shifts this branch runs, then assign them below.</p>
        </div>
        <div className="flex items-center gap-2">
          {showBranchPicker && (
            <Select value={branchId ? String(branchId) : ""} onValueChange={(v) => onBranchChange(Number(v))}>
              <SelectTrigger className="h-9 w-44 rounded-lg text-sm"><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="rounded-lg" onClick={openNew}>
                <Plus className="size-4" /> Add shift
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>{editing ? "Edit shift" : "New shift"}</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Name</Label>
                  <Input name="name" defaultValue={editing?.name ?? ""} placeholder="e.g. Morning" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Start</Label>
                    <Input type="time" name="start_time" defaultValue={editing ? fmtTime(editing.startTime) : ""} required />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>End</Label>
                    <Input type="time" name="end_time" defaultValue={editing ? fmtTime(editing.endTime) : ""} required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={pending} className="rounded-lg">{pending ? "Saving…" : "Save shift"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {shifts.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No shifts defined for this branch yet.</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {shifts.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-3 pr-1.5 text-xs">
              <Clock3 className="size-3 text-muted-foreground" />
              <span className="font-medium">{s.name}</span>
              <span className="num text-muted-foreground">{fmtTime(s.startTime)}–{fmtTime(s.endTime)}</span>
              <button className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground" onClick={() => openEdit(s)}>
                <Pencil className="size-3" />
              </button>
              <button className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(s.id)}>
                <Trash2 className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Staff's own */

function MyScheduleList({
  schedule,
  onPrev,
  onNext,
  loading,
}: {
  schedule: WeekSchedule;
  onPrev: () => void;
  onNext: () => void;
  loading: boolean;
}) {
  const own = schedule.rows[0];

  return (
    <div className="panel min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">My schedule</h2>
          <p className="text-sm text-muted-foreground">
            {fmtDate(schedule.dates[0])} – {fmtDate(schedule.dates[6])}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-8 rounded-lg" onClick={onPrev} disabled={loading}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8 rounded-lg" onClick={onNext} disabled={loading}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <ul className="divide-y divide-border">
        {schedule.dates.map((d, i) => {
          const cell = own?.days[d];
          return (
            <li key={d} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="text-sm font-medium">{DAY_LABEL[i]}</p>
                <p className="num text-xs text-muted-foreground">{fmtDate(d)}</p>
              </div>
              {cell ? (
                <div className="text-right">
                  <p className="text-sm font-medium">{cell.shiftName}</p>
                  <p className="num text-xs text-muted-foreground">{fmtTime(cell.startTime)}–{fmtTime(cell.endTime)}</p>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Off</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
