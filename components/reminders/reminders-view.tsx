"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { differenceInDays } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/currency";
import { formatDateIST } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";

function urgencyClass(dueDate: string) {
  const days = differenceInDays(new Date(dueDate), new Date());
  if (days < 0) return "bg-lic-red-600 text-white font-semibold";
  if (days === 0) return "bg-lic-red-100 text-lic-red-600 font-semibold";
  if (days <= 7) return "bg-lic-yellow-100 text-lic-yellow-700";
  if (days <= 14) return "bg-lic-amber-100 text-lic-amber-600";
  return "bg-lic-neutral-200 text-lic-neutral-800";
}

export function RemindersView() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const qc = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const res = await fetch("/api/reminders?status=pending,sent");
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  async function dismiss(id: string) {
    await fetch(`/api/reminders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss" }),
    });
    qc.invalidateQueries({ queryKey: ["reminders"] });
  }

  const byDate: Record<string, typeof reminders> = {};
  reminders.forEach((r: { due_date: string }) => {
    if (!byDate[r.due_date]) byDate[r.due_date] = [];
    byDate[r.due_date].push(r);
  });

  return (
    <>
      <PageHeader
        title="Premium reminders"
        description="Due dates and scheduled reminder alerts"
        actions={
          <div className="flex gap-2">
            <Button
              variant={view === "list" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
            >
              List
            </Button>
            <Button
              variant={view === "calendar" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setView("calendar")}
            >
              Calendar
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : reminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No pending reminders"
          description="Reminders are created when policies have upcoming premium due dates."
        />
      ) : view === "calendar" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(byDate).map(([date, items]) => (
            <div key={date} className="rounded-card border bg-white p-4 shadow-card">
              <p className="font-semibold">{formatDateIST(date)}</p>
              <p className="text-xs text-lic-neutral-500">{items.length} premium(s)</p>
              <ul className="mt-2 space-y-1 text-sm">
                {(items as Array<{ id: string; policy: { policy_number: string }; customer: { full_name: string } }>).map((r) => (
                  <li key={r.id}>{r.customer?.full_name} · {r.policy?.policy_number}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-lic-blue-50">
                {["Customer", "Policy", "Due date", "Days", "Premium", "Reminder", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs uppercase text-lic-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reminders.map((r: {
                id: string;
                due_date: string;
                reminder_date: string;
                days_before_due: number;
                status: string;
                policy_id: string;
                policy: { policy_number: string; premium_amount: number };
                customer: { full_name: string };
              }) => {
                const days = differenceInDays(new Date(r.due_date), new Date());
                return (
                  <tr key={r.id} className="border-b">
                    <td className="px-3 py-2">{r.customer?.full_name}</td>
                    <td className="px-3 py-2">{r.policy?.policy_number}</td>
                    <td className="px-3 py-2">{formatDateIST(r.due_date)}</td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded-badge px-2 py-0.5 text-xs", urgencyClass(r.due_date))}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                      </span>
                    </td>
                    <td className="px-3 py-2">{formatINR(Number(r.policy?.premium_amount))}</td>
                    <td className="px-3 py-2 text-lic-neutral-500">{r.days_before_due}d before</td>
                    <td className="px-3 py-2"><Badge>{r.status}</Badge></td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <Link href={`/dashboard/payments/record?policy=${r.policy_id}`}>
                          <Button size="sm">Pay</Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => dismiss(r.id)}>Dismiss</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
