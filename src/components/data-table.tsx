import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
};

export function DataTable<T>({
  title,
  description,
  columns,
  rows,
  toolbar,
  minWidth = 720,
}: {
  title: string;
  description?: string;
  columns: Column<T>[];
  rows: T[];
  toolbar?: ReactNode;
  minWidth?: number;
}) {
  return (
    <section className="panel min-w-0 overflow-hidden">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          {description && <p className="truncate text-sm text-muted-foreground">{description}</p>}
        </div>
        {toolbar}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead>
            <tr className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-5 py-3 font-semibold ${c.align === "right" ? "text-right" : "text-left"}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, i) => (
              <tr key={i} className="transition-colors hover:bg-muted/50">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-5 py-3.5 ${c.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}