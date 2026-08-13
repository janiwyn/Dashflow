"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { browserSupportsWebAuthn, platformAuthenticatorIsAvailable, startRegistration } from "@simplewebauthn/browser";
import { AlertTriangle, Fingerprint, LogIn, LogOut } from "lucide-react";

import { clockSelf, finishBiometricEnrollment, startBiometricEnrollment } from "@/app/actions/attendance";
import { Button } from "@/components/ui/button";
import type { getOwnEmployeeRecord } from "@/db/queries/attendance";

type OwnEmployee = Awaited<ReturnType<typeof getOwnEmployeeRecord>>;

const timeFmt = (d: Date | null) =>
  d ? new Date(d).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false }) : "—";

/**
 * The one real "am I clocked in" widget — shared between the Attendance page
 * and the staff dashboard so there's a single source of truth for self
 * clock-in/out and biometric self-enrollment instead of two copies drifting
 * apart.
 */
export function MyAttendanceCard({
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
