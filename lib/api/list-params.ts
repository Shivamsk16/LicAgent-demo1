export type SortOrder = "asc" | "desc";

/** Postgrest filter builder after `.select()` — loose type for chained filter helpers. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FilterableQuery = any;

export type ListParams = {
  page: number;
  pageSize: number;
  sort?: string;
  order: SortOrder;
  offset: number;
};

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export function parseListParams(
  searchParams: URLSearchParams,
  options?: { defaultSort?: string; defaultOrder?: SortOrder }
): ListParams {
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE)
  );
  const sort = searchParams.get("sort") ?? options?.defaultSort;
  const order = (searchParams.get("order") === "asc" ? "asc" : "desc") as SortOrder;
  const offset = (page - 1) * pageSize;
  return { page, pageSize, sort, order, offset };
}

export function applySort<T extends { order: (col: string, opts?: { ascending?: boolean }) => T }>(
  query: T,
  sort: string | undefined,
  order: SortOrder,
  allowed: Record<string, string>
): T {
  const column = sort && allowed[sort] ? allowed[sort] : Object.values(allowed)[0];
  return query.order(column, { ascending: order === "asc" });
}

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  return { items, total, page, pageSize };
}
