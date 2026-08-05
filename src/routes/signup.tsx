import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { branchesData } from "@/lib/branch-data";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Meridian POS" },
      { name: "description", content: "Create a new admin, manager or staff account for Meridian POS." },
      { property: "og:title", content: "Sign up — Meridian POS" },
      { property: "og:description", content: "Register a new business or join an existing branch." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const [role, setRole] = useState("staff");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="size-6" />
          Meridian POS
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight">Set up your business in minutes.</h1>
          <p className="mt-4 text-sm text-primary-foreground/80">
            Admins and managers create a business, staff join an existing branch using its branch key.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-primary-foreground/80">
            <ShieldCheck className="size-4" />
            Staff accounts require branch approval via a branch key.
          </div>
        </div>
        <p className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} Meridian POS. All rights reserved.</p>
      </div>

      <div className="flex items-center justify-center overflow-y-auto p-6 sm:p-10">
        <div className="w-full max-w-sm py-6">
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Create an account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Join Meridian POS</p>
          </div>

          {message && (
            <div
              className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
                message.error ? "bg-destructive/12 text-destructive" : "bg-success/12 text-success"
              }`}
            >
              {message.text}
            </div>
          )}

          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setMessage({ text: "Account created successfully! You can now sign in." });
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" required className="rounded-lg" placeholder="e.g. jkariuki" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required className="rounded-lg" placeholder="you@business.co.ke" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" required className="rounded-lg" placeholder="0712 345 678" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (new business)</SelectItem>
                  <SelectItem value="manager">Manager (new business)</SelectItem>
                  <SelectItem value="staff">Staff (join a branch)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === "staff" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label>Branch</Label>
                  <Select defaultValue={String(branchesData[0]?.id)}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {branchesData.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="branch-key">Branch key</Label>
                  <Input id="branch-key" name="branch_key" required className="rounded-lg" placeholder="Provided by your branch manager" />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="business-name">Business name</Label>
                <Input id="business-name" name="business_name" required className="rounded-lg" placeholder="e.g. Meridian Traders Ltd" />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required className="rounded-lg" placeholder="••••••••" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input id="confirm-password" name="confirm_password" type="password" required className="rounded-lg" placeholder="••••••••" />
            </div>

            <Button type="submit" className="mt-2 rounded-lg">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}