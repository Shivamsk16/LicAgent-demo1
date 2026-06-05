"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDateTimeIST } from "@/lib/utils/dates";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList } from "lucide-react";

export function AuditLogTable({ tenantId }: { tenantId?: string }) {
  const [action, setAction] = useState("");
  const qs = new URLSearchParams({
    ...(tenantId && { tenant_id: tenantId }),
    ...(action && { action }),
    limit: "100",
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit", qs.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/superadmin/audit?${qs}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  return (
    <div className="space-y-4">
      <input
        placeholder="Filter by action…"
        value={action}
        onChange={(e) => setAction(e.target.value)}
        className="h-9 max-w-xs rounded-btn border border-lic-neutral-200 px-3 text-sm"
      />
      {isLoading ? (
        <TableSkeleton rows={10} cols={5} />
      ) : logs.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No audit logs" description="No matching entries." />
      ) : (
        <div className="overflow-x-auto rounded-card border bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-lic-blue-50">
                {["Time", "Actor", "Action", "Resource", "Details"].map((h) => (
                  <th key={h} className="px-3 py-2 text-xs font-semibold uppercase text-lic-neutral-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log: {
                id: string;
                created_at: string;
                action: string;
                resource_type: string | null;
                before_state: unknown;
                after_state: unknown;
                actor?: { full_name: string };
              }) => (
                <tr key={log.id} className="border-b align-top">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDateTimeIST(log.created_at)}
                  </td>
                  <td className="px-3 py-2">{log.actor?.full_name ?? "System"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{log.action}</td>
                  <td className="px-3 py-2">{log.resource_type ?? "—"}</td>
                  <td className="px-3 py-2">
                    <details>
                      <summary className="cursor-pointer text-lic-blue-400">View diff</summary>
                      <pre className="mt-1 max-w-md overflow-auto rounded bg-lic-neutral-50 p-2 text-xs">
                        {JSON.stringify(
                          { before: log.before_state, after: log.after_state },
                          null,
                          2
                        )}
                      </pre>
                    </details>
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
