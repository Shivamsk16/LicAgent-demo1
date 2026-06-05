"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { formatDateTimeIST } from "@/lib/utils/dates";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";

export function BranchAuditViewer() {
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const qs = new URLSearchParams({
    limit: "200",
    ...(action && { action }),
    ...(resourceType && { resource_type: resourceType }),
    ...(from && { from }),
    ...(to && { to }),
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["branch-audit", qs.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/audit?${qs}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  function exportCSV() {
    window.open(`/api/audit?${qs}&format=csv`, "_blank");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch audit log"
        description="All actions recorded in this branch"
        actions={
          <Button variant="secondary" size="sm" onClick={exportCSV}>
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Filter action…"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="h-9 rounded-btn border px-2 text-sm"
        />
        <select
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          className="h-9 rounded-btn border px-2 text-sm"
        >
          <option value="">All resources</option>
          <option value="customer">Customer</option>
          <option value="policy">Policy</option>
          <option value="payment">Payment</option>
          <option value="tenant_member">Member</option>
          <option value="kyc_document">KYC</option>
          <option value="import_job">Import</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 rounded-btn border px-2 text-sm" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 rounded-btn border px-2 text-sm" />
      </div>

      {isLoading ? (
        <TableSkeleton rows={12} cols={5} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No audit entries"
          description="Actions performed in this branch will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-card border bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-lic-blue-50">
                {["Time", "Actor", "Action", "Resource", "Details"].map((h) => (
                  <th key={h} className="px-3 py-2 text-xs font-semibold uppercase text-lic-neutral-500 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-lic-neutral-500">
                    No audit entries found.
                  </td>
                </tr>
              )}
              {logs.map((log: {
                id: string;
                created_at: string;
                action: string;
                resource_type: string | null;
                resource_id: string | null;
                ip_address: string | null;
                before_state: unknown;
                after_state: unknown;
                actor?: { full_name: string };
              }) => (
                <tr key={log.id} className="border-b align-top">
                  <td className="px-3 py-2 whitespace-nowrap">{formatDateTimeIST(log.created_at)}</td>
                  <td className="px-3 py-2">{log.actor?.full_name ?? "System"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{log.action}</td>
                  <td className="px-3 py-2">
                    {log.resource_type ?? "—"}
                    {log.resource_id && (
                      <div className="text-xs text-lic-neutral-500 truncate max-w-[120px]">
                        {log.resource_id}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
