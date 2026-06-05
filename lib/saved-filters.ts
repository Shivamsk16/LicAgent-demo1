export type SavedFilter = {
  id: string;
  name: string;
  values: Record<string, string>;
  createdAt: string;
};

const STORAGE_PREFIX = "lic-saved-filters:";

export function getSavedFilters(page: string): SavedFilter[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + page);
    return raw ? (JSON.parse(raw) as SavedFilter[]) : [];
  } catch {
    return [];
  }
}

export function saveFilter(page: string, name: string, values: Record<string, string>): SavedFilter {
  const existing = getSavedFilters(page);
  const item: SavedFilter = {
    id: crypto.randomUUID(),
    name,
    values,
    createdAt: new Date().toISOString(),
  };
  const next = [item, ...existing].slice(0, 10);
  localStorage.setItem(STORAGE_PREFIX + page, JSON.stringify(next));
  return item;
}

export function deleteSavedFilter(page: string, id: string) {
  const next = getSavedFilters(page).filter((f) => f.id !== id);
  localStorage.setItem(STORAGE_PREFIX + page, JSON.stringify(next));
}
