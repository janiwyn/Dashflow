"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Real print (and, via the browser's own print dialog, "save as PDF") — same pattern as receipt/invoice preview. */
export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <Button size="sm" className="rounded-lg" onClick={() => window.print()}>
      <Printer className="size-4" /> {label}
    </Button>
  );
}
