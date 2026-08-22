"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

const LINKS = [
  { href: "#pricing", label: "Pricing" },
  { href: "#product", label: "Product" },
  { href: "#faq", label: "FAQ" },
];

/** The nav's mobile-only hamburger + slide-down panel — a client component since it needs open/close state, kept separate from the server-rendered SiteNav around it. */
export function MobileNav({ userName }: { userName: string | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 place-items-center rounded-lg text-foreground/70 transition-colors hover:bg-secondary"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 z-40 border-b border-border bg-background shadow-lg">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-sm font-medium text-muted-foreground sm:px-6">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={close}
                className="rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/track-order"
              onClick={close}
              className="rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary hover:text-foreground"
            >
              Track an order
            </Link>

            <div className="mt-2 border-t border-border pt-3">
              {userName ? (
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Go to dashboard
                  <ArrowRight className="size-3.5" />
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={close}
                    className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground/80"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={close}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    Sign up free
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
