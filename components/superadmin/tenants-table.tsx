"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateIST } from "@/lib/utils/dates";
import type { TenantWithStats } from "@/types/database";

export function TenantsTable({
  tenants,
  onSuspend,
}: {
  tenants: TenantWithStats[];
  onSuspend?: (id: string, status: string) => void;
}) {
  if (!tenants.length) {
    return (
      <p className="py-12 text-center text-sm text-lic-neutral-500">
        No branches found.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-lic-neutral-200 bg-white shadow-card">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-lic-neutral-200 bg-lic-blue-50">
            {[
              "Branch",
              "Code",
              "City",
              "State",
              "Plan",
              "Agents",
              "Policies",
              "Status",
              "Trial ends",
              "Created",
              "Actions",
            ].map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-lic-neutral-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id} className="border-b border-lic-neutral-200 last:border-0">
              <td className="px-3 py-2 font-medium">{t.name}</td>
              <td className="px-3 py-2">{t.branch_code ?? "—"}</td>
              <td className="px-3 py-2">{t.city ?? "—"}</td>
              <td className="px-3 py-2">{t.state ?? "—"}</td>
              <td className="px-3 py-2">
                <Badge variant={t.plan as "trial"}>{t.plan}</Badge>
              </td>
              <td className="px-3 py-2">{t.agent_count ?? 0}</td>
              <td className="px-3 py-2">{t.policy_count ?? 0}</td>
              <td className="px-3 py-2">
                <Badge variant={t.status as "active"}>{t.status}</Badge>
              </td>
              <td className="px-3 py-2">
                {t.trial_ends_at ? formatDateIST(t.trial_ends_at) : "—"}
              </td>
              <td className="px-3 py-2">{formatDateIST(t.created_at)}</td>
              <td className="px-3 py-2">
                <div className="flex gap-1">
                  <Link href={`/superadmin/tenants/${t.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                  {onSuspend && t.status === "active" && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onSuspend(t.id, "suspended")}
                    >
                      Suspend
                    </Button>
                  )}
                  {onSuspend && t.status === "suspended" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onSuspend(t.id, "active")}
                    >
                      Reactivate
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
