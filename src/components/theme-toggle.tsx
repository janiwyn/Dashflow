"use client";

import { useEffect, useState, useTransition } from "react";
import { Moon, Sun } from "lucide-react";

import { setOwnTheme } from "@/app/actions/users";
import { cn } from "@/lib/utils";

type Mode = "light" | "dark";

/**
 * Light/dark toggle for the web app. The choice is persisted to the signed-in
 * user's own account (via setOwnTheme), not to localStorage — theme is a
 * per-account preference, and localStorage is scoped to the device, so a
 * device-scoped value leaks one staff member's choice into the next person
 * who logs into the same shared POS terminal. The <html> class still flips
 * immediately for instant feedback; the server write is what makes the
 * choice follow the account to any other device.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("light");
  const [, startTransition] = useTransition();

  useEffect(() => {
    setMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const apply = (next: Mode) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    setMode(next);
    startTransition(() => {
      setOwnTheme(next);
    });
  };

  return (
    <div className="inline-flex rounded-lg border border-border bg-muted p-1">
      <button
        type="button"
        onClick={() => apply("light")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
          mode === "light" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Sun className="size-4" />
        Light
      </button>
      <button
        type="button"
        onClick={() => apply("dark")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
          mode === "dark" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Moon className="size-4" />
        Dark
      </button>
    </div>
  );
}
