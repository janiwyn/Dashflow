"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { formatMoney, type CurrencyCode } from "@/lib/currency";

const CurrencyContext = createContext<CurrencyCode | null>(null);

export function CurrencyProvider({
  code,
  children,
}: {
  code: CurrencyCode;
  children: ReactNode;
}) {
  return <CurrencyContext.Provider value={code}>{children}</CurrencyContext.Provider>;
}

/**
 * Returns the business's active currency code plus a `format` helper bound
 * to it. Use this instead of the static `currency()` in lib/format.ts
 * anywhere the amount should reflect the business's own currency setting.
 */
export function useCurrency() {
  const code = useContext(CurrencyContext);
  const resolved = code ?? "UGX";
  return useMemo(
    () => ({ code: resolved, format: (amount: number) => formatMoney(amount, resolved) }),
    [resolved],
  );
}
