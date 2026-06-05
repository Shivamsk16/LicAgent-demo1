"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateIST } from "@/lib/utils/dates";

interface MemberRow {
  id: string;
  status: string;
  employee_id: string | null;
  invited_at: string;
  joined_at: string | null;
  user?: { full_name: string; email: string };
  role?: { name: string; display_name: string | null };
}

export function TenantMembersTable({
  tenantId,
  members: initial,
}: {
  tenantId: string;
  members: MemberRow[];
}) {
  const [members, setMembers] = useState(initial);
  const [showInvite, setShowInvite] = useState(false);

  async function updateMember(memberId: string, body: Record<string, unknown>) {
    const res = await fetch(
      `/api/superadmin/tenants/${tenantId}/members/${memberId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (res.ok) {
      const json = await res.json();
      setMembers((m) => m.map((x) => (x.id === memberId ? { ...x, ...json.data } : x)));
    }
  }

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/superadmin/tenants/${tenantId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fd.get("full_name"),
        email: fd.get("email"),
        role_name: fd.get("role_name"),
        employee_id: fd.get("employee_id") || undefined,
      }),
    });
    if (res.ok) {
      setShowInvite(false);
      window.location.reload();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowInvite(!showInvite)}>Invite agent</Button>
      </div>

      {showInvite && (
        <form onSubmit={invite} className="rounded-card border bg-white p-4 shadow-card">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Full name</Label>
              <Input name="full_name" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" required />
            </div>
            <div>
              <Label>Role</Label>
              <select name="role_name" className="h-9 w-full rounded-btn border px-2 text-sm" required>
                <option value="agent">Agent</option>
                <option value="senior_agent">Senior Agent</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <Label>Employee ID</Label>
              <Input name="employee_id" />
            </div>
          </div>
          <Button type="submit" className="mt-3" size="sm">
            Send invitation
          </Button>
        </form>
      )}

      <div className="overflow-x-auto rounded-card border bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-lic-blue-50">
              {["Name", "Email", "Employee ID", "Role", "Status", "Joined", "Actions"].map(
                (h) => (
                  <th key={h} className="px-3 py-2 text-xs font-semibold uppercase text-lic-neutral-500">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="px-3 py-2">{m.user?.full_name ?? "—"}</td>
                <td className="px-3 py-2">{m.user?.email}</td>
                <td className="px-3 py-2">{m.employee_id ?? "—"}</td>
                <td className="px-3 py-2">
                  <Badge>{m.role?.display_name ?? m.role?.name}</Badge>
                </td>
                <td className="px-3 py-2">
                  <Badge variant={m.status as "active"}>{m.status}</Badge>
                </td>
                <td className="px-3 py-2">
                  {m.joined_at ? formatDateIST(m.joined_at) : "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {m.status === "active" && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          updateMember(m.id, { status: "suspended", reason: "Admin action" })
                        }
                      >
                        Suspend
                      </Button>
                    )}
                    {m.status === "suspended" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => updateMember(m.id, { status: "active" })}
                      >
                        Reactivate
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateMember(m.id, { status: "removed" })}
                    >
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
