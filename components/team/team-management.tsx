"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/utils/currency";
import { formatDateIST } from "@/lib/utils/dates";
import { EmptyState } from "@/components/ui/empty-state";
import { StatGridSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { UserCog } from "lucide-react";

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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as {
        members: Member[];
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
      setInviteUrl(json.data.inviteUrl);
      qc.invalidateQueries({ queryKey: ["team"] });
      e.currentTarget.reset();
    } else {
      alert(json.error?.message ?? "Invite failed");
    }
  }

  async function updateMember(
    memberId: string,
    body: Record<string, unknown>
  ) {
    const res = await fetch(`/api/team/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) qc.invalidateQueries({ queryKey: ["team"] });
    else {
      const json = await res.json();
      alert(json.error?.message ?? "Update failed");
    }
  }

  async function resendInvite(memberId: string) {
    const res = await fetch(`/api/team/${memberId}/resend`, { method: "POST" });
    const json = await res.json();
    if (json.success) {
      setInviteUrl(json.data.inviteUrl);
      alert("Invitation resent");
    }
  }

  const members = data?.members ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Invite agents, manage roles, and monitor performance"
        actions={
          <Button onClick={() => { setInviteOpen(true); setInviteUrl(null); }}>
            Invite agent
          </Button>
        }
      />

      {data?.stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Total" value={data.stats.total} accent="blue" />
          <StatCard label="Active" value={data.stats.active} accent="green" />
          <StatCard label="Invited" value={data.stats.invited} accent="amber" />
          <StatCard label="Suspended" value={data.stats.suspended} accent="amber" />
        </div>
      )}

      {inviteOpen && (
        <div className="rounded-card border bg-white p-6 shadow-card">
          <h3 className="font-semibold">Invite team member</h3>
          <form onSubmit={invite} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input name="full_name" placeholder="Full name" required />
            <Input name="email" type="email" placeholder="Email" required />
            <select name="role_name" className="h-9 rounded-btn border px-2 text-sm" required>
              <option value="senior_agent">Senior agent</option>
              <option value="agent">Agent</option>
              <option value="viewer">Viewer</option>
            </select>
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
                onClick={() => navigator.clipboard.writeText(inviteUrl)}
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
        <EmptyState
          icon={UserCog}
          title="No team members"
          description="Use Invite agent above to add your first team member."
        />
      ) : (
        <div className="overflow-x-auto rounded-card border bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-lic-blue-50">
                {["Name", "Role", "Status", "Customers", "Policies", "Commission", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-2 py-2 text-left text-xs uppercase text-lic-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="px-2 py-2">
                    <div className="font-medium">{m.user?.full_name}</div>
                    <div className="text-xs text-lic-neutral-500">{m.user?.email}</div>
                    {m.employee_id && <div className="text-xs">{m.employee_id}</div>}
                  </td>
                  <td className="px-2 py-2">{m.role?.display_name ?? m.role?.name}</td>
                  <td className="px-2 py-2"><Badge>{m.status}</Badge></td>
                  <td className="px-2 py-2">{m.stats?.customers ?? 0}</td>
                  <td className="px-2 py-2">{m.stats?.policies ?? 0}</td>
                  <td className="px-2 py-2">{formatINR(m.stats?.commissionMonth ?? 0)}</td>
                  <td className="px-2 py-2">
                    {m.joined_at ? formatDateIST(m.joined_at) : "—"}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      <select
                        className="h-8 rounded border px-1 text-xs"
                        defaultValue={m.role?.name}
                        onChange={(e) =>
                          updateMember(m.id, { role_name: e.target.value })
                        }
                      >
                        <option value="senior_agent">Senior</option>
                        <option value="agent">Agent</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      {m.status === "invited" && (
                        <Button variant="ghost" size="sm" onClick={() => resendInvite(m.id)}>
                          Resend
                        </Button>
                      )}
                      {m.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const reason = prompt("Suspend reason?");
                            if (reason !== null) {
                              updateMember(m.id, { status: "suspended", reason });
                            }
                          }}
                        >
                          Suspend
                        </Button>
                      )}
                      {m.status === "suspended" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateMember(m.id, { status: "active" })}
                        >
                          Reactivate
                        </Button>
                      )}
                      <Link href={`/dashboard/customers?agent=${m.user_id}`}>
                        <Button variant="ghost" size="sm">Customers</Button>
                      </Link>
                      <Link href={`/dashboard/commission?agent_id=${m.user_id}`}>
                        <Button variant="ghost" size="sm">Commission</Button>
                      </Link>
                    </div>
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
