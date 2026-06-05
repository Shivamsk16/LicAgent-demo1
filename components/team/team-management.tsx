"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { ConfirmModal, PromptModal } from "@/components/ui/modal";
import { formatINR } from "@/lib/utils/currency";
import { formatDateIST } from "@/lib/utils/dates";
import { Select } from "@/components/ui/select";
import { SmartEmptyState } from "@/components/ui/smart-empty-state";
import { SavedFilters } from "@/components/shared/saved-filters";
import { MobileFilterSheet } from "@/components/shared/mobile-filter-sheet";
import { StatGridSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { useFilterUrlSync } from "@/lib/hooks/use-filter-url-sync";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { DataTableBulkBar } from "@/components/shared/data-table-bulk-bar";
import { toast } from "@/lib/toast";
import { useSort } from "@/lib/hooks/use-sort";
import { downloadCSV, rowsToCSV } from "@/lib/utils/csv";
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

const PAGE_SIZE = 25;

type Member = {
  id: string;
  user_id: string;
  status: string;
  employee_id: string | null;
  joined_at: string | null;
  user?: { full_name: string; email: string };
  role?: { name: string; display_name: string };
  stats?: { customers: number; policies: number; commissionMonth: number };
};

export function TeamManagement() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [suspendMember, setSuspendMember] = useState<Member | null>(null);
  const [reactivateMember, setReactivateMember] = useState<Member | null>(null);
  const [roleChange, setRoleChange] = useState<{ member: Member; role: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const { sort, order, toggleSort } = useSort("invited_at", "desc");

  useFilterUrlSync({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["team", statusFilter, page, sort, order],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sort,
        order,
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      const res = await fetch(`/api/team?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as PaginatedResult<Member> & {
        stats: { total: number; active: number; invited: number; suspended: number };
      };
    },
  });

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fd.get("full_name"),
        email: fd.get("email"),
        role_name: fd.get("role_name"),
        employee_id: fd.get("employee_id") || undefined,
      }),
    });
    const json = await res.json();
    if (json.success) {
      const url = json.data.inviteUrl as string;
      setInviteUrl(url);
      toast.success("Invitation sent", "Share the invite link with your teammate", {
        label: "Copy link",
        onClick: () => {
          navigator.clipboard.writeText(url);
          toast.info("Link copied");
        },
      });
      qc.invalidateQueries({ queryKey: ["team"] });
      e.currentTarget.reset();
    } else {
      toast.error("Invite failed", json.error?.message ?? "Try again");
    }
  }

  async function updateMember(
    memberId: string,
    body: Record<string, unknown>
  ) {
    setActionLoading(true);
    const res = await fetch(`/api/team/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setActionLoading(false);
    if (res.ok) {
      toast.success("Member updated");
      qc.invalidateQueries({ queryKey: ["team"] });
    } else {
      const json = await res.json();
      toast.error("Update failed", json.error?.message ?? "Try again");
    }
  }

  async function resendInvite(memberId: string) {
    const res = await fetch(`/api/team/${memberId}/resend`, { method: "POST" });
    const json = await res.json();
    if (json.success) {
      setInviteUrl(json.data.inviteUrl);
      toast.success("Invitation resent");
    } else {
      toast.error("Resend failed", json.error?.message ?? "Try again");
    }
  }

  function handleSuspend(reason: string) {
    if (!suspendMember) return;
    updateMember(suspendMember.id, { status: "suspended", reason });
    setSuspendMember(null);
  }

  const members = data?.items ?? [];
  const total = data?.total ?? 0;

  async function bulkStatusUpdate() {
    if (!bulkStatus || selected.size === 0) return;
    const res = await fetch("/api/team/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success(`Updated ${json.data.updated} members`);
      setSelected(new Set());
      setBulkStatus("");
      qc.invalidateQueries({ queryKey: ["team"] });
    } else {
      toast.error("Status update failed", json.error?.message);
    }
  }

  function exportSelected() {
    const rows = members.filter((m) => selected.size === 0 || selected.has(m.id));
    downloadCSV(
      "team.csv",
      rowsToCSV(
        ["Name", "Email", "Role", "Status", "Customers", "Policies"],
        rows.map((m) => [
          m.user?.full_name,
          m.user?.email,
          m.role?.display_name,
          m.status,
          m.stats?.customers,
          m.stats?.policies,
        ])
      )
    );
    toast.success("Export downloaded");
  }

  return (
    <div className="section-gap">
      <PageHeader
        title="Team"
        description="Invite agents, manage roles, and monitor performance"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Team" },
        ]}
        actions={
          <>
            <Link href="/dashboard/team/invites">
              <Button variant="secondary">View invites</Button>
            </Link>
            <Button onClick={() => { setInviteOpen(true); setInviteUrl(null); }}>
              Invite agent
            </Button>
          </>
        }
      />

      {isError && (
        <Alert variant="error" title="Could not load team">
          {error instanceof Error ? error.message : "Something went wrong."}
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-xs font-medium underline"
          >
            Try again
          </button>
        </Alert>
      )}

      <div className="filter-toolbar">
        <div className="hidden md:flex md:items-center md:gap-3">
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            containerClassName="w-[160px]"
            aria-label="Member status filter"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="suspended">Suspended</option>
          </Select>
          <SavedFilters
            page="team"
            currentValues={{ status: statusFilter }}
            onApply={(v) => {
              setStatusFilter(v.status ?? "all");
              setPage(1);
            }}
          />
        </div>
        <MobileFilterSheet activeCount={statusFilter !== "all" ? 1 : 0}>
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            containerClassName="w-full"
            aria-label="Member status filter"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="suspended">Suspended</option>
          </Select>
        </MobileFilterSheet>
      </div>

      <DataTableBulkBar selectedCount={selected.size} onClear={() => setSelected(new Set())}>
        <Button variant="secondary" size="sm" onClick={exportSelected}>Export</Button>
        <Select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} containerClassName="w-[140px]" className="h-8 text-xs">
          <option value="">Set status…</option>
          <option value="active">Activate</option>
          <option value="suspended">Suspend</option>
        </Select>
        <Button size="sm" variant="secondary" disabled={!bulkStatus} onClick={bulkStatusUpdate}>Update status</Button>
      </DataTableBulkBar>

      {data?.stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Total" value={data.stats.total} accent="blue" />
          <StatCard label="Active" value={data.stats.active} accent="green" />
          <StatCard label="Invited" value={data.stats.invited} accent="amber" />
          <StatCard label="Suspended" value={data.stats.suspended} accent="amber" />
        </div>
      )}

      {inviteOpen && (
        <div className="rounded-xl bg-lic-neutral-0 p-6 ring-1 ring-black/\[0\.06\]">
          <h3 className="font-semibold">Invite team member</h3>
          <form onSubmit={invite} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input name="full_name" placeholder="Full name" required />
            <Input name="email" type="email" placeholder="Email" required />
            <Select name="role_name" containerClassName="w-full" required>
              <option value="senior_agent">Senior agent</option>
              <option value="agent">Agent</option>
              <option value="viewer">Viewer</option>
            </Select>
            <Input name="employee_id" placeholder="Employee ID (optional)" />
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit">Send invitation</Button>
              <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
          {inviteUrl && (
            <p className="mt-3 text-sm">
              Invite link:{" "}
              <button
                type="button"
                className="text-lic-blue-400 underline"
                onClick={() => {
                  navigator.clipboard.writeText(inviteUrl);
                  toast.success("Link copied to clipboard");
                }}
              >
                Copy link
              </button>
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <>
          <StatGridSkeleton count={4} />
          <TableSkeleton rows={6} cols={8} />
        </>
      ) : members.length === 0 ? (
        <SmartEmptyState
          entity="team"
          hasFilters={statusFilter !== "all"}
          onClearFilters={() => {
            setStatusFilter("all");
            setPage(1);
          }}
          onAction={() => {
            setInviteOpen(true);
            setInviteUrl(null);
          }}
          override={{ actionLabel: "Invite agent" }}
        />
      ) : (
        <TableContainer title={`${total} member${total === 1 ? "" : "s"}`}>
          <Table dense>
            <TableHeader sticky>
              <TableRow>
                <TableHead className="w-10"><input type="checkbox" checked={selected.size === members.length && members.length > 0} onChange={() => setSelected(selected.size === members.length ? new Set() : new Set(members.map((m) => m.id)))} /></TableHead>
                <TableHead sticky>Name</TableHead>
                <TableHead hideOnMobile className="hidden md:table-cell">Role</TableHead>
                <SortableTableHead label="Status" column="status" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} />
                <TableHead hideOnMobile className="hidden lg:table-cell">Customers</TableHead>
                <TableHead hideOnMobile className="hidden lg:table-cell">Policies</TableHead>
                <TableHead hideOnMobile className="hidden md:table-cell">Commission</TableHead>
                <SortableTableHead label="Joined" column="joined_at" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} hideOnMobile className="hidden lg:table-cell" />
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id} interactive selected={selected.has(m.id)}>
                  <TableCell><input type="checkbox" checked={selected.has(m.id)} onChange={() => setSelected((prev) => { const n = new Set(prev); if (n.has(m.id)) n.delete(m.id); else n.add(m.id); return n; })} /></TableCell>
                  <TableCell sticky>
                    <div className="font-medium text-lic-neutral-900">{m.user?.full_name}</div>
                    <div className="text-xs text-lic-neutral-500">{m.user?.email}</div>
                    {m.employee_id && <div className="text-xs">{m.employee_id}</div>}
                  </TableCell>
                  <TableCell hideOnMobile className="hidden md:table-cell">{m.role?.display_name ?? m.role?.name}</TableCell>
                  <TableCell><Badge>{m.status}</Badge></TableCell>
                  <TableCell hideOnMobile className="hidden lg:table-cell">{m.stats?.customers ?? 0}</TableCell>
                  <TableCell hideOnMobile className="hidden lg:table-cell">{m.stats?.policies ?? 0}</TableCell>
                  <TableCell hideOnMobile className="hidden md:table-cell">{formatINR(m.stats?.commissionMonth ?? 0)}</TableCell>
                  <TableCell hideOnMobile className="hidden lg:table-cell">
                    {m.joined_at ? formatDateIST(m.joined_at) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Select
                        containerClassName="w-[100px]"
                        className="h-8 text-xs"
                        value={m.role?.name}
                        onChange={(e) => {
                          if (e.target.value !== m.role?.name) {
                            setRoleChange({ member: m, role: e.target.value });
                          }
                        }}
                      >
                        <option value="senior_agent">Senior</option>
                        <option value="agent">Agent</option>
                        <option value="viewer">Viewer</option>
                      </Select>
                      {m.status === "invited" && (
                        <Button variant="ghost" size="sm" onClick={() => resendInvite(m.id)}>
                          Resend
                        </Button>
                      )}
                      {m.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => setSuspendMember(m)}
                        >
                          Suspend
                        </Button>
                      )}
                      {m.status === "suspended" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => setReactivateMember(m)}
                        >
                          Reactivate
                        </Button>
                      )}
                      <Link
                        href={`/dashboard/customers?agent=${m.user_id}&agent_name=${encodeURIComponent(m.user?.full_name ?? "")}`}
                      >
                        <Button variant="ghost" size="sm">Customers</Button>
                      </Link>
                      <Link href={`/dashboard/commission?agent_id=${m.user_id}`}>
                        <Button variant="ghost" size="sm">Commission</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </TableContainer>
      )}

      <PromptModal
        open={suspendMember !== null}
        onClose={() => setSuspendMember(null)}
        onSubmit={handleSuspend}
        title="Suspend team member"
        description={
          suspendMember
            ? `Suspend ${suspendMember.user?.full_name ?? "this member"}? They will lose access until reactivated.`
            : undefined
        }
        label="Suspension reason"
        placeholder="e.g. Left the branch"
        confirmLabel="Suspend"
        loading={actionLoading}
      />

      <ConfirmModal
        open={reactivateMember !== null}
        onClose={() => setReactivateMember(null)}
        onConfirm={() => {
          if (reactivateMember) {
            updateMember(reactivateMember.id, { status: "active" });
            setReactivateMember(null);
          }
        }}
        title="Reactivate team member"
        description={
          reactivateMember
            ? `Restore access for ${reactivateMember.user?.full_name ?? "this member"}?`
            : undefined
        }
        confirmLabel="Reactivate"
        variant="primary"
        loading={actionLoading}
      />

      <ConfirmModal
        open={roleChange !== null}
        onClose={() => setRoleChange(null)}
        onConfirm={() => {
          if (roleChange) {
            updateMember(roleChange.member.id, { role_name: roleChange.role });
            setRoleChange(null);
          }
        }}
        title="Change role"
        description={
          roleChange
            ? `Change ${roleChange.member.user?.full_name}'s role to ${roleChange.role.replace(/_/g, " ")}?`
            : undefined
        }
        confirmLabel="Change role"
        variant="primary"
        loading={actionLoading}
      />
    </div>
  );
}
