"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FilterValues = Record<string, string | undefined>;

function desiredQuery(
  filters: FilterValues,
  preserve: string[],
  searchParams: URLSearchParams
) {
  const next = new URLSearchParams();
  for (const key of preserve) {
    const value = searchParams.get(key);
    if (value) next.set(key, value);
  }
  for (const [key, value] of Object.entries(filters)) {
    if (value && value !== "all") next.set(key, value);
  }
  return next.toString();
}

function currentQuery(
  filterKeys: string[],
  preserve: string[],
  searchParams: URLSearchParams
) {
  const next = new URLSearchParams();
  for (const key of preserve) {
    const value = searchParams.get(key);
    if (value) next.set(key, value);
  }
  for (const key of filterKeys) {
    const value = searchParams.get(key);
    if (value) next.set(key, value);
  }
  return next.toString();
}

/**
 * Keeps list filter state in the URL for shareable, bookmarkable views.
 * Skips the first render so values initialized from the URL are preserved.
 */
export function useFilterUrlSync(
  filters: FilterValues,
  options?: { preserve?: string[] }
) {
  const preserve = options?.preserve ?? [];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ready = useRef(false);
  const serialized = JSON.stringify(filters);

  useEffect(() => {
    if (!ready.current) {
      ready.current = true;
      return;
    }

    const parsed = JSON.parse(serialized) as FilterValues;
    const filterKeys = Object.keys(parsed);
    const nextQs = desiredQuery(parsed, preserve, searchParams);
    const curQs = currentQuery(filterKeys, preserve, searchParams);

    if (nextQs === curQs) return;

    router.replace(nextQs ? `${pathname}?${nextQs}` : pathname, { scroll: false });
  }, [serialized, pathname, preserve.join(","), router, searchParams]);
}
