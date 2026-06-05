"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
        <form onSubmit={invite} className="rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/\[0\.06\]">
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
              <Select name="role_name" containerClassName="w-full" required>
                <option value="agent">Agent</option>
                <option value="senior_agent">Senior Agent</option>
                <option value="viewer">Viewer</option>
              </Select>
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

      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              {["Name", "Email", "Employee ID", "Role", "Status", "Joined", "Actions"].map(
                (h) => (
                  <TableHead key={h}>{h}</TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id} interactive>
                <TableCell className="font-medium text-lic-neutral-900">{m.user?.full_name ?? "—"}</TableCell>
                <TableCell>{m.user?.email}</TableCell>
                <TableCell>{m.employee_id ?? "—"}</TableCell>
                <TableCell>
                  <Badge>{m.role?.display_name ?? m.role?.name}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={m.status as "active"}>{m.status}</Badge>
                </TableCell>
                <TableCell>
                  {m.joined_at ? formatDateIST(m.joined_at) : "—"}
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
