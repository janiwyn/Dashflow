"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Package, Receipt, Search, ShieldCheck, Users } from "lucide-react";

import { globalSearch, type GlobalSearchResult } from "@/app/actions/search";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { useCurrency } from "@/components/currency-provider";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EMPTY_TENANT: GlobalSearchResult = { kind: "tenant", products: [], customers: [], sales: [] };
const EMPTY_PLATFORM: GlobalSearchResult = { kind: "platform", businesses: [], admins: [] };

export function GlobalSearch({ isSuper }: { isSuper: boolean }) {
  const router = useRouter();
  const { format: currency } = useCurrency();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<GlobalSearchResult>(isSuper ? EMPTY_PLATFORM : EMPTY_TENANT);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced, server-side — the whole point is searching data that isn't loaded on
  // this page (a product typed anywhere still needs to hit the database), so this
  // can't be a plain client-side .filter() over some already-fetched list.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResult(isSuper ? EMPTY_PLATFORM : EMPTY_TENANT);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        setResult(await globalSearch(query));
      });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isSuper]);

  const hasQuery = query.trim().length >= 2;
  const hasResults =
    result.kind === "tenant"
      ? result.products.length + result.customers.length + result.sales.length > 0
      : result.businesses.length + result.admins.length > 0;

  const goTo = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <Popover open={open && hasQuery}>
      <PopoverTrigger asChild>
        <div className="relative min-w-0 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder={isSuper ? "Search businesses, admins…" : "Search products, receipts, customers…"}
            className="h-9 rounded-lg border-border bg-background pl-9 text-sm"
            autoComplete="off"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={() => setOpen(false)}
      >
        <Command shouldFilter={false}>
          <CommandList className="max-h-[360px]">
            {pending && <div className="py-6 text-center text-sm text-muted-foreground">Searching…</div>}
            {!pending && !hasResults && <CommandEmpty>No results for &quot;{query.trim()}&quot;.</CommandEmpty>}

            {!pending && result.kind === "tenant" && (
              <>
                {result.products.length > 0 && (
                  <CommandGroup heading="Products">
                    {result.products.map((p) => (
                      <CommandItem key={`p-${p.id}`} value={`product-${p.id}`} onSelect={() => goTo("/inventory")}>
                        <Package className="size-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{p.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {currency(p.sellingPrice)} · {p.stock} in stock
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {result.customers.length > 0 && (
                  <CommandGroup heading="Customers">
                    {result.customers.map((c) => (
                      <CommandItem key={`c-${c.id}`} value={`customer-${c.id}`} onSelect={() => goTo("/customers")}>
                        <Users className="size-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {c.accountBalance > 0 ? `Owes ${currency(c.accountBalance)}` : "No balance"}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {result.sales.length > 0 && (
                  <CommandGroup heading="Receipts">
                    {result.sales.map((s) => (
                      <CommandItem key={`s-${s.id}`} value={`sale-${s.id}`} onSelect={() => goTo("/sales")}>
                        <Receipt className="size-4 text-muted-foreground" />
                        <span className="flex-1 truncate">
                          {s.reference} — {s.customerName}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{currency(s.total)}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}

            {!pending && result.kind === "platform" && (
              <>
                {result.businesses.length > 0 && (
                  <CommandGroup heading="Businesses">
                    {result.businesses.map((b) => (
                      <CommandItem key={`b-${b.id}`} value={`business-${b.id}`} onSelect={() => goTo(`/view-business?id=${b.id}`)}>
                        <Building2 className="size-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{b.name}</span>
                        <span className="shrink-0 text-xs capitalize text-muted-foreground">{b.status}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {result.admins.length > 0 && (
                  <CommandGroup heading="Admins">
                    {result.admins.map((a) => (
                      <CommandItem key={`a-${a.id}`} value={`admin-${a.id}`} onSelect={() => goTo(`/edit-admin?id=${a.id}`)}>
                        <ShieldCheck className="size-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{a.name}</span>
                        <span className="shrink-0 truncate text-xs text-muted-foreground">{a.email}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
