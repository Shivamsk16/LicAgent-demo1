"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <TableContainer>
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
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
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((t) => (
            <TableRow key={t.id} interactive>
              <TableCell className="font-medium text-lic-neutral-900">{t.name}</TableCell>
              <TableCell>{t.branch_code ?? "—"}</TableCell>
              <TableCell>{t.city ?? "—"}</TableCell>
              <TableCell>{t.state ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={t.plan as "trial"}>{t.plan}</Badge>
              </TableCell>
              <TableCell>{t.agent_count ?? 0}</TableCell>
              <TableCell>{t.policy_count ?? 0}</TableCell>
              <TableCell>
                <Badge variant={t.status as "active"}>{t.status}</Badge>
              </TableCell>
              <TableCell>
                {t.trial_ends_at ? formatDateIST(t.trial_ends_at) : "—"}
              </TableCell>
              <TableCell>{formatDateIST(t.created_at)}</TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
