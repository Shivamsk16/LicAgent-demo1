"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTableBulkBar } from "@/components/shared/data-table-bulk-bar";
import { SavedFilters } from "@/components/shared/saved-filters";
import { MobileFilterSheet } from "@/components/shared/mobile-filter-sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { SmartEmptyState } from "@/components/ui/smart-empty-state";
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
import type { Payment } from "@/types/business";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const PAGE_SIZE = 25;

type PaymentsResponse = PaginatedResult<Payment> & {
  summary: { totalCollected: number };
};

export function PaymentsLedger() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "all");
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [from, setFrom] = useState(() => searchParams.get("from") ?? "");
  const [to, setTo] = useState(() => searchParams.get("to") ?? "");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { sort, order, toggleSort } = useSort("payment_date", "desc");
  const debouncedSearch = useDebouncedValue(search);

  useFilterUrlSync({
    q: debouncedSearch || undefined,
    status: status !== "all" ? status : undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["payments", status, debouncedSearch, from, to, page, sort, order],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sort,
        order,
        ...(status !== "all" && { status }),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(from && { from }),
        ...(to && { to }),
      });
      const res = await fetch(`/api/payments?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as PaymentsResponse;
    },
  });

  const payments = data?.items ?? [];
  const total = data?.total ?? 0;
  const activeFilterCount = [status !== "all", debouncedSearch, from, to].filter(Boolean).length;

  function exportSelected() {
    const rows = payments.filter((p) => selected.size === 0 || selected.has(p.id));
    downloadCSV(
      "payments.csv",
      rowsToCSV(
        ["Date", "Customer", "Policy", "Amount", "Status", "Receipt"],
        rows.map((p) => [
          p.payment_date,
          p.customer?.full_name,
          p.policy?.policy_number,
          p.amount_paid,
          p.status,
          p.receipt_number,
        ])
      )
    );
    toast.success("Export downloaded", "Your CSV file is ready");
  }

  const filterFields = (
    <>
      <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} containerClassName="w-full md:w-[160px]" aria-label="Payment status">
        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="w-full md:w-[160px]" aria-label="From date" />
      <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="w-full md:w-[160px]" aria-label="To date" />
    </>
  );

  return (
    <>
      <PageHeader
        title="Payment ledger"
        description="View and filter all recorded premium payments."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Payments" }]}
        actions={
          <Link href="/dashboard/payments/record">
            <Button><Plus className="h-4 w-4" strokeWidth={1.75} /> Record payment</Button>
          </Link>
        }
      />
      <div className="filter-toolbar">
        <div className="relative min-w-0 flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lic-neutral-400" strokeWidth={1.75} />
          <Input
            placeholder="Receipt #…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
            aria-label="Search payments by receipt"
          />
        </div>
        <div className="hidden flex-wrap items-center gap-3 md:flex">
          {filterFields}
          <SavedFilters
            page="payments"
            currentValues={{ status, search, from, to }}
            onApply={(v) => {
              setStatus(v.status ?? "all");
              setSearch(v.search ?? "");
              setFrom(v.from ?? "");
              setTo(v.to ?? "");
              setPage(1);
            }}
          />
        </div>
        <MobileFilterSheet activeCount={activeFilterCount}>{filterFields}</MobileFilterSheet>
      </div>

      {data?.summary && (
        <div className="inline-flex items-baseline gap-3">
          <span className="text-[13px] text-lic-neutral-500">Total collected</span>
          <span className="font-mono text-xl font-semibold tabular-nums tracking-tight text-lic-neutral-900">
            {formatINR(data.summary.totalCollected)}
          </span>
        </div>
      )}

      <DataTableBulkBar selectedCount={selected.size} onClear={() => setSelected(new Set())}>
        <Button variant="secondary" size="sm" onClick={exportSelected}>Export</Button>
      </DataTableBulkBar>

      {isError ? (
        <Alert variant="error" title="Could not load payments">
          {error instanceof Error ? error.message : "Something went wrong."}
          <Button type="button" variant="link" size="sm" onClick={() => refetch()} className="mt-2 h-auto px-0">
            Try again
          </Button>
        </Alert>
      ) : isLoading ? (
        <TableSkeleton rows={10} cols={10} />
      ) : payments.length === 0 ? (
        <SmartEmptyState
          entity="payments"
          hasFilters={activeFilterCount > 0}
          onClearFilters={() => { setStatus("all"); setSearch(""); setFrom(""); setTo(""); setPage(1); }}
        />
      ) : (
        <TableContainer title={`${total} payment${total === 1 ? "" : "s"}`}>
          <Table dense>
            <TableHeader sticky>
              <TableRow>
                <TableHead className="w-10"><input type="checkbox" onChange={() => setSelected(selected.size === payments.length ? new Set() : new Set(payments.map((p) => p.id)))} checked={selected.size === payments.length && payments.length > 0} aria-label="Select all" /></TableHead>
                <SortableTableHead label="Date" column="payment_date" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} sticky />
                <TableHead hideOnMobile className="hidden md:table-cell">Customer</TableHead>
                <TableHead hideOnMobile className="hidden lg:table-cell">Policy</TableHead>
                <SortableTableHead label="#" column="installment_number" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} />
                <SortableTableHead label="Paid" column="amount_paid" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} align="right" />
                <TableHead hideOnMobile className="hidden md:table-cell" align="right">Late fee</TableHead>
                <TableHead hideOnMobile className="hidden lg:table-cell">Mode</TableHead>
                <TableHead hideOnMobile className="hidden lg:table-cell">Receipt</TableHead>
                <SortableTableHead label="Status" column="status" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} />
                <TableHead align="right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow
                  key={p.id}
                  interactive
                  selected={selected.has(p.id)}
                  onNavigate={() => router.push(`/dashboard/payments/${p.id}`)}
                  navigateLabel={`View payment receipt ${p.receipt_number ?? p.id}`}
                >
                  <TableCell><input type="checkbox" checked={selected.has(p.id)} onChange={() => setSelected((prev) => { const n = new Set(prev); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })} aria-label={`Select payment ${p.receipt_number ?? p.id}`} /></TableCell>
                  <TableCell mono sticky>{formatDateIST(p.payment_date)}</TableCell>
                  <TableCell hideOnMobile className="hidden md:table-cell truncate">{p.customer?.full_name}</TableCell>
                  <TableCell mono hideOnMobile className="hidden lg:table-cell">{p.policy?.policy_number}</TableCell>
                  <TableCell mono>{p.installment_number}</TableCell>
                  <TableCell mono align="right">{formatINR(Number(p.amount_paid))}</TableCell>
                  <TableCell mono align="right" hideOnMobile className="hidden md:table-cell">{formatINR(Number(p.late_fee ?? 0))}</TableCell>
                  <TableCell hideOnMobile className="hidden lg:table-cell">{p.payment_mode}</TableCell>
                  <TableCell mono hideOnMobile className="hidden lg:table-cell">{p.receipt_number ?? "—"}</TableCell>
                  <TableCell><Badge variant="active" dot>{p.status}</Badge></TableCell>
                  <TableCell align="right" data-row-action>
                    <Link
                      href={`/dashboard/payments/${p.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Receipt
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
