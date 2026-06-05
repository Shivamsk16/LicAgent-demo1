"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { ConfirmModal, PromptModal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/utils/currency";
import { toast } from "@/lib/toast";
import { useTenantStore } from "@/store/tenant";

export function PolicyRevivalForm({ policyId }: { policyId: string }) {
  const router = useRouter();
  const role = useTenantStore((s) => s.role);
  const isManager = role === "branch_manager";
  const [loading, setLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  const { data, refetch, isLoading, isError, error } = useQuery({
    queryKey: ["revival", policyId],
    queryFn: async () => {
      const res = await fetch(`/api/policies/${policyId}/revival`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load revival data");
      return json.data;
    },
  });

  const [penalty, setPenalty] = useState("0");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [receipt, setReceipt] = useState("");
  const [notes, setNotes] = useState("");

  if (isLoading) {
    return (
      <div className="max-w-lg space-y-4">
        <Skeleton className="h-40 rounded-card" />
        <Skeleton className="h-56 rounded-card" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="error" title="Could not load revival details">
        {error instanceof Error ? error.message : "Something went wrong."}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Try again
          </Button>
          <Link href={`/dashboard/policies/${policyId}`}>
            <Button size="sm" variant="ghost">Back to policy</Button>
          </Link>
        </div>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert variant="error" title="Revival data unavailable">
        Could not load revival information for this policy.
        <Link href={`/dashboard/policies/${policyId}`} className="mt-2 block text-xs font-medium underline">
          Back to policy
        </Link>
      </Alert>
    );
  }

  const { policy, costs, pendingRevival } = data;
  const totalWithPenalty =
    costs.total_revival_cost + (Number(penalty) || 0) - costs.penalty_amount;

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/policies/${policyId}/revival`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        penaltyAmount: Number(penalty),
        paymentMode,
        receiptNumber: receipt,
        notes,
      }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Revival submitted for approval");
      refetch();
      router.refresh();
    } else {
      const json = await res.json();
      toast.error("Submission failed", json.error?.message ?? "Try again");
    }
  }

  async function approve(approve: boolean, rejectionReason?: string) {
    if (!pendingRevival) return;
    setLoading(true);
    const res = await fetch(`/api/policies/${policyId}/revival`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revivalId: pendingRevival.id,
        approve,
        rejectionReason,
      }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success(approve ? "Revival approved" : "Revival rejected");
      router.push(`/dashboard/policies/${policyId}`);
      router.refresh();
    } else {
      const json = await res.json();
      toast.error("Action failed", json.error?.message ?? "Try again");
    }
  }

  function handleReject(reason: string) {
    approve(false, reason);
    setRejectOpen(false);
  }

  return (
    <div className="max-w-lg space-y-4">
      <Card>
        <h2 className="text-lg font-semibold text-lic-neutral-900">Revival — {policy.policy_number}</h2>
        <p className="text-sm text-lic-neutral-500">Status: {policy.status}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Arrears</dt><dd>{formatINR(costs.arrears_amount)}</dd></div>
          <div className="flex justify-between"><dt>Interest (8%)</dt><dd>{formatINR(costs.interest_amount)}</dd></div>
          <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatINR(totalWithPenalty)}</dd></div>
          {costs.medical_required && (
            <p className="text-lic-amber-600">Medical report required (lapsed &gt; 6 months)</p>
          )}
        </dl>
      </Card>

      {pendingRevival ? (
        <Card>
          <p className="text-sm">Revival pending manager approval.</p>
          {isManager && (
            <div className="mt-4 flex gap-2">
              <Button onClick={() => setApproveOpen(true)} disabled={loading}>Approve</Button>
              <Button variant="danger" onClick={() => setRejectOpen(true)} disabled={loading}>Reject</Button>
            </div>
          )}
        </Card>
      ) : (
        <Card className="space-y-3">
          <div>
            <Label>Penalty (optional)</Label>
            <Input type="number" value={penalty} onChange={(e) => setPenalty(e.target.value)} />
          </div>
          <div>
            <Label>Payment mode</Label>
            <Select containerClassName="w-full" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="neft">NEFT</option>
              <option value="upi">UPI</option>
            </Select>
          </div>
          <div>
            <Label>Receipt number</Label>
            <Input value={receipt} onChange={(e) => setReceipt(e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button onClick={() => setSubmitOpen(true)} disabled={loading}>
            Submit for approval
          </Button>
        </Card>
      )}

      <ConfirmModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onConfirm={() => {
          submit();
          setSubmitOpen(false);
        }}
        title="Submit revival request"
        description={`Submit revival for ${policy.policy_number} with total cost ${formatINR(totalWithPenalty)}? A manager will review before the policy is restored.`}
        confirmLabel="Submit"
        variant="primary"
        loading={loading}
      />

      <ConfirmModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={() => {
          approve(true);
          setApproveOpen(false);
        }}
        title="Approve revival"
        description={`Approve revival for policy ${policy.policy_number}? The policy will be restored to in-force status.`}
        confirmLabel="Approve revival"
        variant="primary"
        loading={loading}
      />

      <PromptModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={handleReject}
        title="Reject revival"
        description="Provide a reason for rejecting this revival request."
        label="Rejection reason"
        placeholder="e.g. Medical report not provided"
        confirmLabel="Reject revival"
        loading={loading}
      />
    </div>
  );
}
