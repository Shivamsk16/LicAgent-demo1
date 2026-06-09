"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTableBulkBar } from "@/components/shared/data-table-bulk-bar";
import { Button, buttonVariants } from "@/components/ui/button";
import { CustomerWizardModal } from "@/components/customers/customer-wizard-modal";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useFilterUrlSync } from "@/lib/hooks/use-filter-url-sync";
import { useSort } from "@/lib/hooks/use-sort";
import { downloadCSV, rowsToCSV } from "@/lib/utils/csv";
import { toast } from "@/lib/toast";
import type { PaginatedResult } from "@/lib/api/list-params";
import { Plus, Search, X } from "lucide-react";
import { useTenantStore } from "@/store/tenant";
import type { Customer } from "@/types/business";

const kycVariant: Record<string, "pending" | "active" | "trial" | "suspended" | "starter"> = {
  pending: "pending",
  documents_uploaded: "starter",
  verified: "active",
  rejected: "suspended",
};

const KYC_OPTIONS = [
  { value: "all", label: "All KYC" },
  { value: "pending", label: "Pending" },
  { value: "documents_uploaded", label: "Documents uploaded" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

const PAGE_SIZE = 25;

export function CustomersList() {
  const router = useRouter();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agent");
  const agentName = searchParams.get("agent_name");
  const isManager = useTenantStore((s) => s.isManager);

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [kyc, setKyc] = useState(() => searchParams.get("kyc") ?? "all");
  const [page, setPage] = useState(1);
  const [customerModalOpen, setCustomerModalOpen] = useState(
    () => searchParams.get("new") === "1"
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignAgent, setAssignAgent] = useState("");
  const [bulkKyc, setBulkKyc] = useState("");
  const { sort, order, toggleSort } = useSort("created_at", "desc");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCustomerModalOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("new");
      const qs = params.toString();
      router.replace(qs ? `/dashboard/customers?${qs}` : "/dashboard/customers", {
        scroll: false,
      });
    }
  }, [searchParams, router]);

  useFilterUrlSync(
    {
      q: debouncedSearch || undefined,
      kyc: kyc !== "all" ? kyc : undefined,
    },
    { preserve: ["agent", "agent_name"] }
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["customers", debouncedSearch, kyc, agentId, page, sort, order],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sort,
        order,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(kyc !== "all" && { kyc_status: kyc }),
        ...(agentId && { agent: agentId }),
      });
      const res = await fetch(`/api/customers?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load customers");
      return json.data as PaginatedResult<Customer>;
    },
  });

  const { data: agentsData } = useQuery({
    queryKey: ["commission-agents"],
    queryFn: async () => {
      const res = await fetch("/api/commissions/agents");
      const json = await res.json();
      return json.data?.agents ?? [];
    },
    enabled: isManager,
  });

  const customers = data?.items ?? [];
  const total = data?.total ?? 0;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === customers.length) setSelected(new Set());
    else setSelected(new Set(customers.map((c) => c.id)));
  }

  async function bulkAssign() {
    if (!assignAgent || selected.size === 0) return;
    const res = await fetch("/api/customers/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), assigned_agent_id: assignAgent }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success(`Assigned ${json.data.updated} customers`);
      setSelected(new Set());
      setAssignAgent("");
      qc.invalidateQueries({ queryKey: ["customers"] });
    } else {
      toast.error("Assign failed", json.error?.message);
    }
  }

  async function bulkKycUpdate() {
    if (!bulkKyc || selected.size === 0) return;
    const res = await fetch("/api/customers/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), kyc_status: bulkKyc }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success(`Updated KYC for ${json.data.updated} customers`);
      setSelected(new Set());
      setBulkKyc("");
      qc.invalidateQueries({ queryKey: ["customers"] });
    } else {
      toast.error("KYC update failed", json.error?.message);
    }
  }

  function exportSelected() {
    const rows = customers.filter((c) => selected.size === 0 || selected.has(c.id));
    downloadCSV(
      "customers.csv",
      rowsToCSV(
        ["Code", "Name", "Phone", "City", "KYC", "Agent"],
        rows.map((c) => [
          c.customer_code,
          c.full_name,
          c.phone,
          c.city,
          c.kyc_status,
          c.agent?.full_name,
        ])
      )
    );
    toast.success("Export downloaded");
  }

  function clearAgentFilter() {
    router.push("/dashboard/customers");
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage customer profiles, KYC status, and policy assignments."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Customers" }]}
        actions={
          <Button onClick={() => setCustomerModalOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Add customer
          </Button>
        }
      />

      <CustomerWizardModal
        open={customerModalOpen}
        onOpenChange={setCustomerModalOpen}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["customers"] });
          toast.success("Customer created");
        }}
      />

      {agentId && isManager && (
        <Alert variant="info" title="Filtered by agent">
          Showing customers assigned to {agentName ?? "this agent"}.
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={clearAgentFilter}
            className="mt-1 h-auto gap-1 px-0"
          >
            <X className="h-3 w-3" /> Clear filter
          </Button>
        </Alert>
      )}

      <div className="filter-toolbar">
        <div className="relative min-w-0 flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lic-neutral-400" strokeWidth={1.75} />
          <Input
            placeholder="Search name, phone, PAN…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
            aria-label="Search customers"
          />
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Select value={kyc} onChange={(e) => { setKyc(e.target.value); setPage(1); }} containerClassName="w-[180px]" aria-label="KYC status filter">
            {KYC_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          <SavedFilters
            page="customers"
            currentValues={{ search, kyc }}
            onApply={(v) => {
              setSearch(v.search ?? "");
              setKyc(v.kyc ?? "all");
              setPage(1);
            }}
          />
        </div>
        <MobileFilterSheet activeCount={[kyc !== "all", search].filter(Boolean).length}>
          <Select value={kyc} onChange={(e) => { setKyc(e.target.value); setPage(1); }} containerClassName="w-full">
            {KYC_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </MobileFilterSheet>
      </div>

      <DataTableBulkBar selectedCount={selected.size} onClear={() => setSelected(new Set())}>
        <Button variant="secondary" size="sm" onClick={exportSelected}>Export</Button>
        {isManager && (
          <>
            <Select value={assignAgent} onChange={(e) => setAssignAgent(e.target.value)} containerClassName="w-[160px]" className="h-8 text-xs">
              <option value="">Assign to…</option>
              {(agentsData ?? []).map((a: { id: string; full_name: string }) => (
                <option key={a.id} value={a.id}>{a.full_name}</option>
              ))}
            </Select>
            <Button size="sm" disabled={!assignAgent} onClick={bulkAssign}>Assign</Button>
            <Select value={bulkKyc} onChange={(e) => setBulkKyc(e.target.value)} containerClassName="w-[160px]" className="h-8 text-xs">
              <option value="">Set KYC…</option>
              {KYC_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <Button size="sm" variant="secondary" disabled={!bulkKyc} onClick={bulkKycUpdate}>Update KYC</Button>
          </>
        )}
      </DataTableBulkBar>

      {isError ? (
        <Alert variant="error" title="Could not load customers">
          {error instanceof Error ? error.message : "Something went wrong."}
          <Button type="button" variant="link" size="sm" onClick={() => refetch()} className="mt-2 h-auto px-0">
            Try again
          </Button>
        </Alert>
      ) : isLoading ? (
        <TableSkeleton rows={10} cols={8} />
      ) : customers.length === 0 ? (
        <SmartEmptyState
          entity="customers"
          hasFilters={!!debouncedSearch || kyc !== "all" || !!agentId}
          onAction={() => setCustomerModalOpen(true)}
          onClearFilters={() => {
            setSearch("");
            setKyc("all");
            if (agentId) router.push("/dashboard/customers");
            setPage(1);
          }}
          override={
            agentId
              ? {
                  title: "No customers for this agent",
                  description: "This agent has no assigned customers yet.",
                }
              : undefined
          }
        />
      ) : (
        <TableContainer title={`${total} customer${total === 1 ? "" : "s"}`}>
          <Table dense>
            <TableHeader sticky>
              <TableRow>
                <TableHead className="w-10">
                  <input type="checkbox" checked={selected.size === customers.length && customers.length > 0} onChange={toggleAll} aria-label="Select all" />
                </TableHead>
                <SortableTableHead label="Code" column="customer_code" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} sticky />
                <SortableTableHead label="Name" column="full_name" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} />
                <SortableTableHead label="Phone" column="phone" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} hideOnMobile />
                <SortableTableHead label="City" column="city" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} className="hidden lg:table-cell" />
                <SortableTableHead label="KYC" column="kyc_status" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} />
                <TableHead hideOnMobile className="hidden md:table-cell">Agent</TableHead>
                <TableHead align="right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow
                  key={c.id}
                  interactive
                  selected={selected.has(c.id)}
                  onNavigate={() => router.push(`/dashboard/customers/${c.id}`)}
                  navigateLabel={`View ${c.full_name}`}
                >
                  <TableCell>
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} aria-label={`Select ${c.full_name}`} />
                  </TableCell>
                  <TableCell mono sticky truncate>{c.customer_code ?? "—"}</TableCell>
                  <TableCell primary truncate>{c.full_name}</TableCell>
                  <TableCell mono hideOnMobile>{c.phone}</TableCell>
                  <TableCell hideOnMobile className="hidden lg:table-cell">{c.city ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={kycVariant[c.kyc_status] ?? "pending"} dot>{c.kyc_status}</Badge>
                  </TableCell>
                  <TableCell hideOnMobile className="hidden md:table-cell">{c.agent?.full_name ?? "—"}</TableCell>
                  <TableCell align="right" data-row-action>
                    <Link
                      href={`/dashboard/customers/${c.id}`}
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
