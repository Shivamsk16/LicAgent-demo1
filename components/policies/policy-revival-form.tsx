"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/currency";
import { useTenantStore } from "@/store/tenant";

export function PolicyRevivalForm({ policyId }: { policyId: string }) {
  const router = useRouter();
  const role = useTenantStore((s) => s.role);
  const isManager = role === "branch_manager";
  const [loading, setLoading] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["revival", policyId],
    queryFn: async () => {
      const res = await fetch(`/api/policies/${policyId}/revival`);
      const json = await res.json();
      return json.data;
    },
  });

  const [penalty, setPenalty] = useState("0");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [receipt, setReceipt] = useState("");
  const [notes, setNotes] = useState("");

  if (!data) return <p className="text-sm text-lic-neutral-500">Loading…</p>;

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
      refetch();
      router.refresh();
    } else {
      const json = await res.json();
      alert(json.error?.message);
    }
  }

  async function approve(approve: boolean) {
    if (!pendingRevival) return;
    const reason = !approve ? prompt("Rejection reason:") : undefined;
    setLoading(true);
    await fetch(`/api/policies/${policyId}/revival`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revivalId: pendingRevival.id,
        approve,
        rejectionReason: reason,
      }),
    });
    setLoading(false);
    router.push(`/dashboard/policies/${policyId}`);
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-4">
      <Card>
        <h2 className="font-semibold">Revival — {policy.policy_number}</h2>
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
              <Button onClick={() => approve(true)} disabled={loading}>Approve</Button>
              <Button variant="danger" onClick={() => approve(false)} disabled={loading}>Reject</Button>
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
            <select className="h-9 w-full rounded-btn border px-2 text-sm" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="neft">NEFT</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          <div>
            <Label>Receipt number</Label>
            <Input value={receipt} onChange={(e) => setReceipt(e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Submitting…" : "Submit for approval"}
          </Button>
        </Card>
      )}
    </div>
  );
}
