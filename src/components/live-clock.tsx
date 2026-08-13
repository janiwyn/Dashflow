"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";

/**
 * A real-time clock + calendar readout for dashboard headers. Starts as
 * `null` and only sets the actual time after mount, so the server-rendered
 * markup never has to guess the visitor's clock (avoids a hydration
 * mismatch) — same pattern already used for the admin dashboard's greeting.
 */
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2 sm:px-4">
      <div className="flex items-center gap-1.5">
        <Clock className="size-4 shrink-0 text-muted-foreground" />
        <span className="num min-w-[4.5rem] text-sm font-semibold tabular-nums">
          {now ? now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "--:--:--"}
        </span>
      </div>
      <div className="hidden h-4 w-px bg-border sm:block" />
      <div className="hidden items-center gap-1.5 sm:flex">
        <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {now ? now.toLocaleDateString("en-KE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : ""}
        </span>
      </div>
    </div>
  );
}
