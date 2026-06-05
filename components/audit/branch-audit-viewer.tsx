"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateTimeIST } from "@/lib/utils/dates";
import { SmartEmptyState } from "@/components/ui/smart-empty-state";
import { SavedFilters } from "@/components/shared/saved-filters";
import { MobileFilterSheet } from "@/components/shared/mobile-filter-sheet";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useFilterUrlSync } from "@/lib/hooks/use-filter-url-sync";
import { Pagination } from "@/components/ui/pagination";
import type { PaginatedResult } from "@/lib/api/list-params";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";

type AuditLog = {
  id: string;
  created_at: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  before_state: unknown;
  after_state: unknown;
  actor?: { full_name: string };
};

export function BranchAuditViewer() {
  const searchParams = useSearchParams();
  const [action, setAction] = useState(() => searchParams.get("action") ?? "");
  const [resourceType, setResourceType] = useState(() => searchParams.get("resource_type") ?? "");
  const [from, setFrom] = useState(() => searchParams.get("from") ?? "");
  const [to, setTo] = useState(() => searchParams.get("to") ?? "");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  useFilterUrlSync({
    action: action || undefined,
    resource_type: resourceType || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    ...(action && { action }),
    ...(resourceType && { resource_type: resourceType }),
    ...(from && { from }),
    ...(to && { to }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["branch-audit", qs.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/audit?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as PaginatedResult<AuditLog>;
    },
  });

  const logs = data?.items ?? [];
  const total = data?.total ?? 0;
  const activeFilterCount = [action, resourceType, from, to].filter(Boolean).length;

  function exportCSV() {
    window.open(`/api/audit?${qs}&format=csv`, "_blank");
  }

  return (
    <div className="section-gap">
      <PageHeader
        title="Audit log"
        description="All actions recorded in this branch"
        backHref="/dashboard/settings"
        backLabel="Back to settings"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings", href: "/dashboard/settings" },
          { label: "Audit log" },
        ]}
        actions={
          <Button variant="secondary" size="sm" onClick={exportCSV}>
            Export CSV
          </Button>
        }
      />

      <div className="filter-toolbar">
        <div className="relative min-w-0 flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lic-neutral-400" strokeWidth={1.75} />
          <Input
            placeholder="Filter action…"
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="pl-9"
            aria-label="Filter by action"
          />
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Select
            value={resourceType}
            onChange={(e) => { setResourceType(e.target.value); setPage(1); }}
            containerClassName="w-[160px]"
            aria-label="Resource type filter"
          >
            <option value="">All resources</option>
            <option value="customer">Customer</option>
            <option value="policy">Policy</option>
            <option value="payment">Payment</option>
            <option value="tenant_member">Member</option>
            <option value="kyc_document">KYC</option>
            <option value="import_job">Import</option>
          </Select>
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="w-[160px]" aria-label="From date" />
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="w-[160px]" aria-label="To date" />
          <SavedFilters
            page="audit"
            currentValues={{ action, resource_type: resourceType, from, to }}
            onApply={(v) => {
              setAction(v.action ?? "");
              setResourceType(v.resource_type ?? "");
              setFrom(v.from ?? "");
              setTo(v.to ?? "");
              setPage(1);
            }}
          />
        </div>
        <MobileFilterSheet activeCount={activeFilterCount}>
          <Select
            value={resourceType}
            onChange={(e) => { setResourceType(e.target.value); setPage(1); }}
            containerClassName="w-full"
            aria-label="Resource type filter"
          >
            <option value="">All resources</option>
            <option value="customer">Customer</option>
            <option value="policy">Policy</option>
            <option value="payment">Payment</option>
            <option value="tenant_member">Member</option>
            <option value="kyc_document">KYC</option>
            <option value="import_job">Import</option>
          </Select>
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} aria-label="From date" />
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} aria-label="To date" />
        </MobileFilterSheet>
      </div>

      {isLoading ? (
        <TableSkeleton rows={12} cols={5} />
      ) : logs.length === 0 ? (
        <SmartEmptyState
          entity="audit"
          hasFilters={activeFilterCount > 0}
          onClearFilters={() => {
            setAction("");
            setResourceType("");
            setFrom("");
            setTo("");
            setPage(1);
          }}
        />
      ) : (
        <TableContainer title={`${total} entr${total === 1 ? "y" : "ies"}`}>
          <Table dense>
            <TableHeader>
              <TableRow>
                {["Time", "Actor", "Action", "Resource", "Details"].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-lic-neutral-500">
                    No audit entries found.
                  </td>
                </TableRow>
              )}
              {logs.map((log) => (
                <TableRow key={log.id} className="align-top">
                  <TableCell className="whitespace-nowrap">{formatDateTimeIST(log.created_at)}</TableCell>
                  <TableCell>{log.actor?.full_name ?? "System"}</TableCell>
                  <TableCell mono>{log.action}</TableCell>
                  <TableCell>
                    {log.resource_type ?? "—"}
                    {log.resource_id && (
                      <div className="text-xs text-lic-neutral-500 truncate max-w-[120px]">
                        {log.resource_id}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <details>
                      <summary className="cursor-pointer text-lic-blue-400 text-xs">View diff</summary>
                      <pre className="mt-1 max-w-md overflow-auto rounded bg-lic-neutral-50 p-2 text-xs">
                        {JSON.stringify(
                          { before: log.before_state, after: log.after_state },
                          null,
                          2
                        )}
                      </pre>
                    </details>
                    {log.ip_address && (
                      <span className="text-xs text-lic-neutral-500">{log.ip_address}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </TableContainer>
      )}
    </div>
  );
}
