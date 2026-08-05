import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Lock, ShieldCheck, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Meridian POS" },
      { name: "description", content: "Secure login portal for Meridian POS business system." },
      { property: "og:title", content: "Sign in — Meridian POS" },
      { property: "og:description", content: "Access your retail business dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [error, setError] = useState("");

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="size-6" />
          Meridian POS
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight">Run every branch from one dashboard.</h1>
          <p className="mt-4 text-sm text-primary-foreground/80">
            Sales, stock, expenses and staff performance across all your locations in Kenya — in real time.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-primary-foreground/80">
            <ShieldCheck className="size-4" />
            Secure, role-based access for admins, managers and staff.
          </div>
        </div>
        <p className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} Meridian POS. All rights reserved.</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Business System</h2>
            <p className="mt-1 text-sm text-muted-foreground">Secure login portal</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/12 px-4 py-2.5 text-sm text-destructive">{error}</div>
          )}

          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError("Invalid username or password");
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="username" name="username" required className="rounded-lg pl-9" placeholder="e.g. jkariuki" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" name="password" type="password" required className="rounded-lg pl-9" placeholder="••••••••" />
              </div>
            </div>
            <Button type="submit" className="mt-2 rounded-lg">
              Login
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}