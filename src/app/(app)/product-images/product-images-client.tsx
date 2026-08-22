"use client";

import { useMemo, useState } from "react";
import { ImageOff, Trash2, Upload } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessionUser } from "@/components/session-provider";
import type { viewBranchNames, viewStockProducts } from "@/db/queries/views";

type Props = {
  branches: Awaited<ReturnType<typeof viewBranchNames>>;
  stockProducts: Awaited<ReturnType<typeof viewStockProducts>>;
};

export default function ProductImagesPage({ branches, stockProducts }: Props) {
  const { hasMultipleBranches } = useSessionUser();
  const [branch, setBranch] = useState("All branches");
  const [search, setSearch] = useState("");
  const [images, setImages] = useState<Record<number, string | null>>({});

  const filtered = useMemo(
    () =>
      stockProducts
        .filter((p) => branch === "All branches" || p.branch === branch)
        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [branch, search],
  );

  function upload(id: number) {
    setImages((prev) => ({ ...prev, [id]: `#${id}-preview` }));
  }
  function remove(id: number) {
    setImages((prev) => ({ ...prev, [id]: null }));
  }

  return (
    <AppShell title="Product images" subtitle="Upload JPG, PNG or WEBP images up to 2MB per product">
      <section className="panel p-5">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 max-w-xs rounded-lg"
          />
          {hasMultipleBranches && (
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="h-9 w-44 rounded-lg text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => {
            const hasImage = images[p.id] !== undefined ? images[p.id] : p.imagePath;
            return (
              <div key={p.id} className="rounded-xl border border-border p-4">
                <div className="grid h-32 w-full place-items-center rounded-lg bg-muted text-muted-foreground">
                  {hasImage ? (
                    <span className="text-xs">Image preview</span>
                  ) : (
                    <ImageOff className="size-8" />
                  )}
                </div>
                <p className="mt-3 truncate text-sm font-medium">{p.name}</p>
                {hasMultipleBranches && <p className="truncate text-xs text-muted-foreground">{p.branch}</p>}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 rounded-lg" onClick={() => upload(p.id)}>
                    <Upload className="size-3.5" /> Upload
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-destructive"
                    disabled={!hasImage}
                    onClick={() => remove(p.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No products match your filters.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
