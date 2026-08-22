"use client";

import type { ReactNode } from "react";
import { Bell, Search, Plus } from "lucide-react";
import Link from "next/link";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useSessionUser } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const user = useSessionUser();
  const isSuper = user.role === "super";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <div className="print:hidden">
          <AppSidebar
            user={{
              name: user.name,
              role: user.role,
              roleLabel: user.roleLabel,
              branch: user.branch,
              initials: user.initials,
              hasMultipleBranches: user.hasMultipleBranches,
              planKey: user.planKey,
            }}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-surface/85 backdrop-blur print:hidden">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
              <SidebarTrigger className="shrink-0" />
              <div className="relative min-w-0 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={isSuper ? "Search businesses, admins…" : "Search products, receipts, customers…"}
                  className="h-9 rounded-lg border-border bg-background pl-9 text-sm"
                />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!isSuper && (
                  <>
                    <Button variant="ghost" size="icon" className="relative rounded-lg" asChild>
                      <Link href="/notifications" aria-label="Notifications">
                        <Bell className="size-4" />
                        <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
                      </Link>
                    </Button>
                    <Button size="sm" className="hidden rounded-lg sm:inline-flex" asChild>
                      <Link href="/pos">
                        <Plus className="size-4" /> New sale
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                  {subtitle && (
                    <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
                {actions && <div className="print:hidden">{actions}</div>}
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
