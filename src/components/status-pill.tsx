/** Coloured badge for sale/receipt status. Shared by the dashboard and sales screens. */
export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Paid"
      ? "bg-success/12 text-success"
      : status === "Pending"
        ? "bg-warning/15 text-warning-foreground"
        : "bg-destructive/12 text-destructive";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}
