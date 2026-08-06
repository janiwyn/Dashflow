"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthPanel } from "@/components/auth/auth-panel";
import {
  AuthDivider,
  ProviderButtons,
  type ProviderAvailability,
} from "@/components/auth/provider-buttons";
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
import { signUp } from "@/lib/auth-client";

type Props = {
  branches: { id: number; name: string }[];
  providers: ProviderAvailability;
};

export default function SignupPage({ branches, providers }: Props) {
  const router = useRouter();
  const [role, setRole] = useState("staff");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    if (password !== String(form.get("confirm_password") ?? "")) {
      setMessage({ text: "Passwords do not match.", error: true });
      return;
    }
    if (password.length < 8) {
      setMessage({ text: "Password must be at least 8 characters.", error: true });
      return;
    }

    setPending(true);
    setMessage(null);

    // Role, business and branch are assigned server-side; the signup payload
    // cannot grant itself privileges (see `input: false` in src/lib/auth.ts).
    const { error } = await signUp.email({
      email: String(form.get("email") ?? "").trim(),
      password,
      name: String(form.get("username") ?? "").trim(),
      username: String(form.get("username") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
    });

    setPending(false);

    if (error) {
      setMessage({ text: error.message ?? "Could not create the account.", error: true });
      return;
    }

    setMessage({ text: "Account created. Redirecting…" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthPanel
        headline="Set up your business in minutes."
        blurb="Admins and managers create a business, staff join an existing branch using its branch key."
        footnote={
          <>
            <ShieldCheck className="size-4 shrink-0" />
            Staff accounts require branch approval via a branch key.
          </>
        }
      />

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

          <ProviderButtons
            available={providers}
            onError={(text) => setMessage({ text, error: true })}
          />

          <AuthDivider label="or sign up with email" />

          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                required
                className="rounded-lg"
                placeholder="e.g. jkariuki"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-lg"
                placeholder="you@business.co.ke"
              />
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
                  <Select name="branch_id" defaultValue={String(branches[0]?.id ?? "")}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="branch-key">Branch key</Label>
                  <Input
                    id="branch-key"
                    name="branch_key"
                    required
                    className="rounded-lg"
                    placeholder="Provided by your branch manager"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="business-name">Business name</Label>
                <Input
                  id="business-name"
                  name="business_name"
                  required
                  className="rounded-lg"
                  placeholder="e.g. Meridian Traders Ltd"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="rounded-lg"
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                name="confirm_password"
                type="password"
                required
                minLength={8}
                className="rounded-lg"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={pending} className="mt-2 rounded-lg">
              {pending ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
