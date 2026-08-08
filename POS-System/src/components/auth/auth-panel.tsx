import type { ReactNode } from "react";

import { HexMark } from "@/components/brand-mark";

import { HexField } from "./hex-field";

/**
 * Left half of the auth split-screen: wordmark, headline and the hex field.
 * Hidden below `lg`, where the form takes the full width.
 */
export function AuthPanel({
  headline,
  blurb,
  footnote,
}: {
  headline: string;
  blurb: string;
  footnote?: ReactNode;
}) {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
      <HexField className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative flex items-center gap-3 text-lg font-semibold">
        <HexMark className="size-8 shrink-0" />
        Dashflow POS
      </div>

      <div className="relative max-w-md">
        <h1 className="text-3xl font-bold leading-tight">{headline}</h1>
        <p className="mt-4 text-sm text-primary-foreground/80">{blurb}</p>
        {footnote && (
          <div className="mt-8 flex items-center gap-2 text-sm text-primary-foreground/80">
            {footnote}
          </div>
        )}
      </div>

      <p className="relative text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} Dashflow POS. All rights reserved.
      </p>
    </div>
  );
}
