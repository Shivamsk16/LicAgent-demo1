"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useCommandPaletteStore } from "@/store/command-palette";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useTenantStore } from "@/store/tenant";
import type { SearchResult } from "@/lib/api/search-types";
import { cn } from "@/lib/utils/cn";

type PaletteItem = {
  id: string;
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  href?: string;
  group: string;
  onSelect?: () => void;
};

const NAV_ITEMS: PaletteItem[] = [
  { id: "nav-dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", group: "Navigation" },
  { id: "nav-customers", label: "Customers", icon: Users, href: "/dashboard/customers", group: "Navigation" },
  { id: "nav-policies", label: "Policies", icon: FileText, href: "/dashboard/policies", group: "Navigation" },
  { id: "nav-payments", label: "Payments", icon: Wallet, href: "/dashboard/payments", group: "Navigation" },
  { id: "nav-reports", label: "Reports", icon: BarChart3, href: "/dashboard/reports", group: "Navigation" },
  { id: "nav-commission", label: "Commissions", icon: IndianRupee, href: "/dashboard/commission", group: "Navigation" },
  { id: "nav-settings", label: "Settings", icon: Settings, href: "/dashboard/settings", group: "Navigation" },
];

const ACTION_ITEMS: PaletteItem[] = [
  { id: "act-customer", label: "Add customer", icon: UserPlus, href: "/dashboard/customers/new", group: "Actions" },
  { id: "act-policy", label: "Add policy", icon: FileText, href: "/dashboard/policies/new", group: "Actions" },
  { id: "act-payment", label: "Record payment", icon: Plus, href: "/dashboard/payments/record", group: "Actions" },
];

const TYPE_ICONS = {
  customer: Users,
  policy: FileText,
  payment: Wallet,
} as const;

export function CommandPalette() {
  const router = useRouter();
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const isManager = useTenantStore((s) => s.isManager);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useFocusTrap(open);
  const debouncedQuery = useDebouncedValue(query, 200);

  const { data: searchData, isFetching } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      const json = await res.json();
      if (!json.success) return [] as SearchResult[];
      return json.data.results as SearchResult[];
    },
    enabled: open && debouncedQuery.length >= 2,
  });

  const staticItems = useMemo(() => {
    const nav = NAV_ITEMS.filter(
      (i) => isManager || !["nav-reports", "nav-commission"].includes(i.id)
    );
    return [...nav, ...ACTION_ITEMS];
  }, [isManager]);

  const filteredStatic = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staticItems;
    return staticItems.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.group.toLowerCase().includes(q)
    );
  }, [query, staticItems]);

  const searchItems: PaletteItem[] = useMemo(
    () =>
      (searchData ?? []).map((r) => ({
        id: `search-${r.type}-${r.id}`,
        label: r.label,
        sublabel: r.sublabel,
        icon: TYPE_ICONS[r.type],
        href: r.href,
        group: "Search results",
      })),
    [searchData]
  );

  const items = useMemo(() => {
    if (debouncedQuery.length >= 2) return [...searchItems, ...filteredStatic];
    return filteredStatic;
  }, [debouncedQuery, searchItems, filteredStatic]);

  const groups = useMemo(() => {
    const map = new Map<string, PaletteItem[]>();
    for (const item of items) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return map;
  }, [items]);

  const flatItems = items;

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, [setOpen]);

  const selectItem = useCallback(
    (item: PaletteItem) => {
      close();
      if (item.href) router.push(item.href);
      else item.onSelect?.();
    },
    [close, router]
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && flatItems[activeIndex]) {
        e.preventDefault();
        selectItem(flatItems[activeIndex]);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, flatItems, activeIndex, close, selectItem]);

  if (!open) return null;

  let itemIndex = -1;

  return (
    <div className="fixed inset-0 z-modal flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm">
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg overflow-hidden rounded-xl bg-lic-neutral-0 shadow-lg ring-1 ring-black/[0.08]"
      >
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-4">
          <Search className="h-4 w-4 shrink-0 text-lic-neutral-400" strokeWidth={1.75} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, policies, or jump to…"
            className="h-12 flex-1 bg-transparent text-[13px] text-lic-neutral-900 placeholder:text-lic-neutral-400 focus:outline-none"
            aria-autocomplete="list"
            aria-controls="command-list"
            autoComplete="off"
          />
          <kbd className="hidden rounded-md bg-lic-neutral-100 px-1.5 py-0.5 text-2xs font-medium text-lic-neutral-500 sm:inline">
            esc
          </kbd>
        </div>

        <ul
          id="command-list"
          role="listbox"
          className="max-h-[min(360px,50vh)] overflow-y-auto p-2 scrollbar-thin"
        >
          {flatItems.length === 0 && (
            <li className="px-3 py-8 text-center text-[13px] text-lic-neutral-500">
              {isFetching ? "Searching…" : "No results found"}
            </li>
          )}
          {Array.from(groups.entries()).map(([group, groupItems]) => (
            <li key={group}>
              <p className="px-2 py-1.5 text-2xs font-medium text-lic-neutral-400">
                {group}
              </p>
              <ul>
                {groupItems.map((item) => {
                  itemIndex += 1;
                  const idx = itemIndex;
                  const Icon = item.icon;
                  return (
                    <li key={item.id} role="option" aria-selected={idx === activeIndex}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-fast ease-out",
                          idx === activeIndex
                            ? "bg-lic-neutral-900 text-white"
                            : "text-lic-neutral-700 hover:bg-black/[0.04]"
                        )}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => selectItem(item)}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            idx === activeIndex ? "text-white/80" : "text-lic-neutral-400"
                          )}
                          strokeWidth={1.75}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{item.label}</p>
                          {item.sublabel && (
                            <p
                              className={cn(
                                "truncate text-2xs",
                                idx === activeIndex ? "text-white/70" : "text-lic-neutral-500"
                              )}
                            >
                              {item.sublabel}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 border-t border-black/[0.06] px-4 py-2.5 text-2xs text-lic-neutral-400">
          <span>
            <kbd className="rounded bg-lic-neutral-100 px-1">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="rounded bg-lic-neutral-100 px-1">↵</kbd> select
          </span>
          <span>
            <kbd className="rounded bg-lic-neutral-100 px-1">?</kbd> shortcuts
          </span>
        </div>
      </div>
    </div>
  );
}
