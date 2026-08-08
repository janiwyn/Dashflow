"use client";

import { useState } from "react";

import { signIn } from "@/lib/auth-client";

/** Google's four-colour "G". Fixed brand colours — not themeable. */
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" className={className} aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z"
      />
    </svg>
  );
}

/** Apple mark, drawn in currentColor so it inverts on the dark button. */
function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={className} aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </svg>
  );
}

export type ProviderAvailability = { google: boolean; apple: boolean };

/**
 * OAuth sign-in buttons. A provider with no credentials configured on the
 * server is rendered disabled rather than hidden, so the missing setup is
 * visible instead of silently failing at the redirect.
 */
export function ProviderButtons({
  available,
  callbackURL = "/",
  onError,
}: {
  available: ProviderAvailability;
  callbackURL?: string;
  onError?: (message: string) => void;
}) {
  const [pending, setPending] = useState<"google" | "apple" | null>(null);

  async function go(provider: "google" | "apple") {
    setPending(provider);
    const { error } = await signIn.social({ provider, callbackURL });
    if (error) {
      onError?.(error.message ?? `Could not sign in with ${provider}.`);
      setPending(null);
    }
    // On success the browser is redirected, so there is no state to reset.
  }

  const notConfigured = (name: string) => `${name} sign-in is not configured on this server.`;

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        disabled={!available.google || pending !== null}
        title={available.google ? undefined : notConfigured("Google")}
        onClick={() => go("google")}
        className="inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-input bg-white text-sm font-medium text-[#1f1f1f] shadow-xs transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleLogo className="size-4 shrink-0" />
        {pending === "google" ? "Redirecting…" : "Continue with Google"}
      </button>

      <button
        type="button"
        disabled={!available.apple || pending !== null}
        title={available.apple ? undefined : notConfigured("Apple")}
        onClick={() => go("apple")}
        className="inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-lg bg-black text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <AppleLogo className="size-4 shrink-0" />
        {pending === "apple" ? "Redirecting…" : "Continue with Apple"}
      </button>
    </div>
  );
}

/** "or" rule between the OAuth block and the credential form. */
export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
