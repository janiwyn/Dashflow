/**
 * Currencies the app knows how to format. Add more here as you onboard
 * businesses in new countries — the settings page reads this list directly.
 */
export const SUPPORTED_CURRENCIES = [
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", locale: "en-KE" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", locale: "en-UG" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", locale: "en-TZ" },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw", locale: "en-RW" },
  { code: "NGN", name: "Nigerian Naira", symbol: "\u20a6", locale: "en-NG" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH\u20b5", locale: "en-GH" },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "GBP", name: "British Pound", symbol: "\u00a3", locale: "en-GB" },
  { code: "EUR", name: "Euro", symbol: "\u20ac", locale: "en-IE" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

const DEFAULT_CURRENCY: CurrencyCode = "KES";

const BY_CODE = new Map(SUPPORTED_CURRENCIES.map((c) => [c.code, c]));

export function currencyMeta(code?: string | null) {
  return BY_CODE.get((code as CurrencyCode) ?? DEFAULT_CURRENCY) ?? BY_CODE.get(DEFAULT_CURRENCY)!;
}

/** Formats an amount using the given ISO currency code, e.g. formatMoney(214720, "UGX") -> "USh 214,720". */
export function formatMoney(amount: number, code?: string | null) {
  const meta = currencyMeta(code);
  return (
    meta.symbol +
    " " +
    Number(amount ?? 0).toLocaleString(meta.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  );
}
