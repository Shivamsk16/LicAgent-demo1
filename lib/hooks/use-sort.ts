import { useCallback, useState } from "react";
import type { SortOrder } from "@/lib/api/list-params";

export function useSort(defaultSort: string, defaultOrder: SortOrder = "desc") {
  const [sort, setSort] = useState(defaultSort);
  const [order, setOrder] = useState<SortOrder>(defaultOrder);

  const toggleSort = useCallback(
    (column: string) => {
      if (sort === column) {
        setOrder((o) => (o === "asc" ? "desc" : "asc"));
      } else {
        setSort(column);
        setOrder("asc");
      }
    },
    [sort]
  );

  return { sort, order, toggleSort, setSort, setOrder };
}
