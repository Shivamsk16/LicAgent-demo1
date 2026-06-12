"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTableBulkBar } from "@/components/shared/data-table-bulk-bar";
import { Button, buttonVariants } from "@/components/ui/button";
import { PolicyWizardModal } from "@/components/policies/policy-wizard-modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { SmartEmptyState } from "@/components/ui/smart-empty-state";
import { SavedFilters } from "@/components/shared/saved-filters";
import { MobileFilterSheet } from "@/components/shared/mobile-filter-sheet";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useFilterUrlSync } from "@/lib/hooks/use-filter-url-sync";
import { useSort } from "@/lib/hooks/use-sort";
import { downloadCSV, rowsToCSV } from "@/lib/utils/csv";
import { toast } from "@/lib/toast";
import type { PaginatedResult } from "@/lib/api/list-params";
import { formatINR } from "@/lib/utils/currency";
import { formatDateIST } from "@/lib/utils/dates";
import { Plus, Search } from "lucide-react";
import type { Policy } from "@/types/business";
import { useTenantStore } from "@/store/tenant";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "in_force", label: "In force" },
  { value: "lapsed", label: "Lapsed" },
  { value: "grace_period", label: "Grace period" },
  { value: "matured", label: "Matured" },
  { value: "surrendered", label: "Surrendered" },
];

const PAGE_SIZE = 25;

export function PoliciesList() {
  const router = useRouter();
  const qc = useQueryClient();
  const isManager = useTenantStore((s) => s.isManager);
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "all";
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [status, setStatus] = useState(() => searchParams.get("status") ?? initialStatus);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [policyModalOpen, setPolicyModalOpen] = useState(
    () => searchParams.get("new") === "1"
  );
  const { sort, order, toggleSort } = useSort("created_at", "desc");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setPolicyModalOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("new");
      const qs = params.toString();
      router.replace(qs ? `/dashboard/policies?${qs}` : "/dashboard/policies", {
        scroll: false,
      });
    }
  }, [searchParams, router]);

  useFilterUrlSync({
    q: debouncedSearch || undefined,
    status: status !== "all" ? status : undefined,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["policies", debouncedSearch, status, page, sort, order],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sort,
        order,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(status !== "all" && { status }),
      });
      const res = await fetch(`/api/policies?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load policies");
      return json.data as PaginatedResult<Policy>;
    },
  });

  const policies = data?.items ?? [];
  const total = data?.total ?? 0;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkStatusUpdate() {
    if (!bulkStatus || selected.size === 0) return;
    const res = await fetch("/api/policies/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success(`Updated ${json.data.updated} policies`);
      setSelected(new Set());
      setBulkStatus("");
      qc.invalidateQueries({ queryKey: ["policies"] });
    } else {
      toast.error("Status update failed", json.error?.message);
    }
  }

  function exportSelected() {
    const rows = policies.filter((p) => selected.size === 0 || selected.has(p.id));
    downloadCSV(
      "policies.csv",
      rowsToCSV(
        ["Policy #", "Customer", "Plan", "Premium", "Status", "Next due"],
        rows.map((p) => [
          p.policy_number,
          p.customer?.full_name,
          p.plan_name,
          p.premium_amount,
          p.status,
          p.next_premium_due,
        ])
      )
    );
    toast.success("Export downloaded");
  }

  return (
    <>
      <PageHeader
        title="Policies"
        description="Track policy lifecycle, premiums, and due dates."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Policies" }]}
        actions={
          <Button onClick={() => setPolicyModalOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={1.75} /> Add policy
          </Button>
        }
      />
      <PolicyWizardModal
        open={policyModalOpen}
        onOpenChange={setPolicyModalOpen}
      />
      <div className="filter-toolbar">
        <div className="relative min-w-0 flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lic-neutral-400" strokeWidth={1.75} />
          <Input placeholder="Policy # or plan…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" aria-label="Search policies" />
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} containerClassName="w-[160px]" aria-label="Policy status filter">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <SavedFilters
            page="policies"
            currentValues={{ search, status }}
            onApply={(v) => {
              setSearch(v.search ?? "");
              setStatus(v.status ?? "all");
              setPage(1);
            }}
          />
        </div>
        <MobileFilterSheet activeCount={[status !== "all", search].filter(Boolean).length}>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} containerClassName="w-full">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </MobileFilterSheet>
      </div>

      <DataTableBulkBar selectedCount={selected.size} onClear={() => setSelected(new Set())}>
        <Button variant="secondary" size="sm" onClick={exportSelected}>Export</Button>
        {isManager && (
          <>
            <Select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} containerClassName="w-[140px]" className="h-8 text-xs">
              <option value="">Set status…</option>
              <option value="in_force">In force</option>
              <option value="lapsed">Lapsed</option>
              <option value="surrendered">Surrendered</option>
              <option value="matured">Matured</option>
            </Select>
            <Button size="sm" variant="secondary" disabled={!bulkStatus} onClick={bulkStatusUpdate}>Update status</Button>
          </>
        )}
      </DataTableBulkBar>

      {isError ? (
        <Alert variant="error" title="Could not load policies">
          {error instanceof Error ? error.message : "Something went wrong."}
          <Button type="button" variant="link" size="sm" onClick={() => refetch()} className="mt-2 h-auto px-0">
            Try again
          </Button>
        </Alert>
      ) : isLoading ? (
        <TableSkeleton rows={10} cols={8} />
      ) : policies.length === 0 ? (
        <SmartEmptyState
          entity="policies"
          hasFilters={!!debouncedSearch || status !== "all"}
          onAction={() => setPolicyModalOpen(true)}
          onClearFilters={() => { setSearch(""); setStatus("all"); setPage(1); }}
        />
      ) : (
        <TableContainer title={`${total} polic${total === 1 ? "y" : "ies"}`}>
          <Table dense>
            <TableHeader sticky>
              <TableRow>
                <TableHead className="w-10"><input type="checkbox" checked={selected.size === policies.length} onChange={() => setSelected(selected.size === policies.length ? new Set() : new Set(policies.map((p) => p.id)))} /></TableHead>
                <TableHead className="w-12">#</TableHead>
                <SortableTableHead label="Policy #" column="policy_number" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} sticky />
                <TableHead hideOnMobile className="hidden md:table-cell">Customer</TableHead>
                <SortableTableHead label="Plan" column="plan_name" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} />
                <SortableTableHead label="Premium" column="premium_amount" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} align="right" hideOnMobile />
                <SortableTableHead label="Next due" column="next_premium_due" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} hideOnMobile className="hidden lg:table-cell" />
                <SortableTableHead label="Status" column="status" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} />
                <TableHead align="right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((p, index) => (
                <TableRow
                  key={p.id}
                  interactive
                  selected={selected.has(p.id)}
                  onNavigate={() => router.push(`/dashboard/policies/${p.id}`)}
                  navigateLabel={`View policy ${p.policy_number}`}
                >
                  <TableCell><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} /></TableCell>
                  <TableCell mono className="w-12 text-lic-neutral-500">{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                  <TableCell primary mono sticky truncate>{p.policy_number}</TableCell>
                  <TableCell hideOnMobile className="hidden md:table-cell truncate">{p.customer?.full_name}</TableCell>
                  <TableCell truncate>{p.plan_name}</TableCell>
                  <TableCell mono align="right" hideOnMobile>{formatINR(Number(p.premium_amount))}</TableCell>
                  <TableCell mono hideOnMobile className="hidden lg:table-cell">{p.next_premium_due ? formatDateIST(p.next_premium_due) : "—"}</TableCell>
                  <TableCell><Badge dot>{p.status}</Badge></TableCell>
                  <TableCell align="right" data-row-action>
                    <Link
                      href={`/dashboard/policies/${p.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </TableContainer>
      )}
    </>
  );
}
