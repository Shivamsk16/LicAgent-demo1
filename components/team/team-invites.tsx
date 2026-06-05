"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { formatDateIST } from "@/lib/utils/dates";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, UserPlus } from "lucide-react";

type Member = {
  id: string;
  status: string;
  joined_at: string | null;
  user?: { full_name: string; email: string };
  role?: { display_name: string; name: string };
};

export function TeamInvites() {
  const qc = useQueryClient();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["team-invites"],
    queryFn: async () => {
      const res = await fetch("/api/team?status=invited&pageSize=100");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data.items as Member[];
    },
  });

  async function resendInvite(memberId: string) {
    const res = await fetch(`/api/team/${memberId}/resend`, { method: "POST" });
    const json = await res.json();
    if (json.success) {
      setInviteUrl(json.data.inviteUrl);
      toast.success("Invitation resent");
      qc.invalidateQueries({ queryKey: ["team-invites"] });
    } else {
      toast.error("Resend failed", json.error?.message ?? "Try again");
    }
  }

  const invites = data ?? [];

  return (
    <div className="section-gap">
      <PageHeader
        title="Invites"
        description="Pending team invitations awaiting acceptance"
        backHref="/dashboard/team"
        backLabel="Back to team"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Team", href: "/dashboard/team" },
          { label: "Invites" },
        ]}
        actions={
          <Link href="/dashboard/team">
            <Button>
              <UserPlus className="h-4 w-4" />
              Invite agent
            </Button>
          </Link>
        }
      />

      {isError && (
        <Alert variant="error" title="Could not load invites">
          {error instanceof Error ? error.message : "Something went wrong."}
          <button type="button" onClick={() => refetch()} className="mt-2 text-xs font-medium underline">
            Try again
          </button>
        </Alert>
      )}

      {inviteUrl && (
        <Alert variant="info" title="Invite link ready">
          <button
            type="button"
            className="text-xs font-medium underline"
            onClick={() => {
              navigator.clipboard.writeText(inviteUrl);
              toast.success("Link copied to clipboard");
            }}
          >
            Copy invite link
          </button>
        </Alert>
      )}

      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : invites.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No pending invites"
          description="Invited team members will appear here until they accept."
          actionLabel="Go to team"
          actionHref="/dashboard/team"
        />
      ) : (
        <TableContainer title={`${invites.length} pending invite${invites.length === 1 ? "" : "s"}`}>
          <Table>
            <TableHeader>
              <TableRow>
                {["Name", "Email", "Role", "Invited", ""].map((h) => (
                  <TableHead key={h || "actions"} align={h === "" ? "right" : "left"}>
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((m) => (
                <TableRow key={m.id} interactive>
                  <TableCell className="font-medium">{m.user?.full_name ?? "—"}</TableCell>
                  <TableCell>{m.user?.email}</TableCell>
                  <TableCell>
                    <Badge variant="pending">{m.role?.display_name ?? m.role?.name}</Badge>
                  </TableCell>
                  <TableCell>{m.joined_at ? formatDateIST(m.joined_at) : "—"}</TableCell>
                  <TableCell align="right">
                    <Button variant="ghost" size="sm" onClick={() => resendInvite(m.id)}>
                      Resend
                    </Button>
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
