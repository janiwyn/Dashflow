export const currency = (n: number) =>
  "KSh " +
  Number(n ?? 0).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const shortDate = (value: Date | string | null | undefined) => {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-KE", { day: "2-digit", month: "short" });
};

export const longDate = (value: Date | string | null | undefined) => {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
};

export const dateTime = (value: Date | string | null | undefined) => {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return `${longDate(d)}, ${clockTime(d)}`;
};

export const clockTime = (value: Date | string | null | undefined) => {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false });
};

/** Percentage change, guarding the divide-by-zero case the dashboard hits on quiet days. */
export const delta = (current: number, previous: number) => {
  if (!previous) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

/** Title-cases the lowercase enum values stored in Postgres, e.g. "mpesa" -> "M-Pesa". */
const LABELS: Record<string, string> = {
  mpesa: "M-Pesa",
  cash: "Cash",
  card: "Card",
  invoice: "Invoice",
  bank: "Bank",
  paid: "Paid",
  pending: "Pending",
  refunded: "Refunded",
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
  open: "Open",
  closed: "Closed",
  retail: "Retail",
  wholesale: "Wholesale",
  finished: "Finished",
  cancelled: "Cancelled",
  verified: "Verified",
  rejected: "Rejected",
  queued: "Queued",
  sent: "Sent",
  failed: "Failed",
  expired: "Expired",
  mtn_merchant: "MTN Merchant",
  airtel_merchant: "Airtel Merchant",
  super: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
};

export const label = (value: string | null | undefined) => {
  if (!value) return "—";
  return LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
};
