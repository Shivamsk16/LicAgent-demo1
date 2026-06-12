"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { formatDateTimeIST } from "@/lib/utils/dates";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Search } from "lucide-react";

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
      <div className="filter-bar">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lic-neutral-400" strokeWidth={1.75} />
          <Input
            placeholder="Filter by action…"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      {isLoading ? (
        <TableSkeleton rows={10} cols={5} />
      ) : logs.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No audit logs" description="No matching entries." />
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                {["#", "Time", "Actor", "Action", "Resource", "Details"].map((h) => (
                  <TableHead key={h} className={h === "#" ? "w-12" : undefined}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: {
                id: string;
                created_at: string;
                action: string;
                resource_type: string | null;
                before_state: unknown;
                after_state: unknown;
                actor?: { full_name: string };
              }, index: number) => (
                <TableRow key={log.id} className="align-top">
                  <TableCell mono className="w-12 text-lic-neutral-500">{index + 1}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTimeIST(log.created_at)}
                  </TableCell>
                  <TableCell>{log.actor?.full_name ?? "System"}</TableCell>
                  <TableCell mono>{log.action}</TableCell>
                  <TableCell>{log.resource_type ?? "—"}</TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
