"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { signOut } from "@/lib/auth-client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Sign out"
      disabled={pending}
      className={className ?? "shrink-0 disabled:opacity-50"}
      onClick={() =>
        startTransition(async () => {
          await signOut();
          router.push("/login");
          router.refresh();
        })
      }
    >
      <LogOut className="size-4 shrink-0 text-sidebar-foreground/50" />
    </button>
  );
}
