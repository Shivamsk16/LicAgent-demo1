"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { ConfirmModal, PromptModal } from "@/components/ui/modal";
import { formatDateIST } from "@/lib/utils/dates";
import { toast } from "@/lib/toast";
import { useTenantStore } from "@/store/tenant";
import { Skeleton } from "@/components/ui/skeleton";

const DOC_TYPES = [
  "aadhaar_front",
  "aadhaar_back",
  "pan",
  "passport",
  "voter_id",
  "driving_license",
  "photo",
  "other",
];

export function KycDocuments({ customerId }: { customerId: string }) {
  const isManager = useTenantStore((s) => s.isManager);
  const role = useTenantStore((s) => s.role);
  const canVerify = isManager || role === "senior_agent";
  const canUpload = role !== "viewer";
  const qc = useQueryClient();

  const [rejectDocId, setRejectDocId] = useState<string | null>(null);
  const [verifyDocId, setVerifyDocId] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["kyc", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}/kyc`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as {
        kyc_status: string;
        documents: Array<{
          id: string;
          doc_type: string;
          file_name: string;
          verified: boolean;
          rejection_reason: string | null;
          created_at: string;
        }>;
      };
    },
  });

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/customers/${customerId}/kyc`, {
      method: "POST",
      body: fd,
    });
    const json = await res.json();
    if (json.success) {
      toast.success("Document uploaded");
      qc.invalidateQueries({ queryKey: ["kyc", customerId] });
      qc.invalidateQueries({ queryKey: ["customer", customerId] });
      e.currentTarget.reset();
    } else {
      toast.error("Upload failed", json.error?.message ?? "Try again");
    }
  }

  async function verify(docId: string, verified: boolean, rejection_reason?: string) {
    setVerifyLoading(true);
    const res = await fetch(`/api/customers/${customerId}/kyc/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified, rejection_reason }),
    });
    setVerifyLoading(false);
    if (res.ok) {
      toast.success(verified ? "Document verified" : "Document rejected");
      qc.invalidateQueries({ queryKey: ["kyc", customerId] });
      qc.invalidateQueries({ queryKey: ["customer", customerId] });
    } else {
      const json = await res.json();
      toast.error("Update failed", json.error?.message ?? "Try again");
    }
  }

  function handleRejectSubmit(reason: string) {
    if (!rejectDocId) return;
    verify(rejectDocId, false, reason);
    setRejectDocId(null);
  }

  async function viewDoc(docId: string) {
    const res = await fetch(`/api/customers/${customerId}/kyc/${docId}`);
    const json = await res.json();
    if (json.success && json.data?.url) {
      window.open(json.data.url, "_blank");
    } else {
      toast.error("Could not open document", json.error?.message ?? "Try again");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="error" title="Could not load KYC documents">
        {error instanceof Error ? error.message : "Something went wrong."}
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-xs font-medium underline"
        >
          Try again
        </button>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-lic-neutral-600">
        Status{" "}
        <Badge dot variant={data?.kyc_status === "verified" ? "active" : "pending"}>
          {data?.kyc_status ?? "pending"}
        </Badge>
      </p>

      {canUpload && (
        <Card padding="sm">
          <form onSubmit={upload} className="filter-bar items-end">
            <Select name="doc_type" containerClassName="w-[180px]" required>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
            <input
              type="file"
              name="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              required
              className="text-sm text-lic-neutral-600 file:mr-3 file:rounded-btn file:border-0 file:bg-lic-neutral-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-lic-neutral-700"
            />
            <Button type="submit" size="sm">
              Upload
            </Button>
            <p className="w-full text-2xs text-lic-neutral-500">
              JPG, PNG, PDF · max 5MB
            </p>
          </form>
        </Card>
      )}

      <ul className="space-y-2">
        {(data?.documents ?? []).length === 0 && (
          <li className="text-sm text-lic-neutral-500">No documents uploaded.</li>
        )}
        {(data?.documents ?? []).map((doc) => (
          <li
            key={doc.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-lic-neutral-0 px-4 py-3 text-[13px] ring-1 ring-inset ring-black/[0.06]"
          >
            <div>
              <span className="font-medium text-lic-neutral-900">
                {doc.file_name}
              </span>
              <span className="ml-2 text-xs text-lic-neutral-500">
                {doc.doc_type.replace(/_/g, " ")} · {formatDateIST(doc.created_at)}
              </span>
              {doc.verified && (
                <Badge className="ml-2" variant="active" dot>
                  Verified
                </Badge>
              )}
              {doc.rejection_reason && !doc.verified && (
                <span className="ml-2 text-xs text-lic-red-600">
                  {doc.rejection_reason}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => viewDoc(doc.id)}>
                View
              </Button>
              {canVerify && !doc.verified && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={verifyLoading}
                    onClick={() => setVerifyDocId(doc.id)}
                  >
                    Verify
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={verifyLoading}
                    onClick={() => setRejectDocId(doc.id)}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <ConfirmModal
        open={verifyDocId !== null}
        onClose={() => setVerifyDocId(null)}
        onConfirm={() => {
          if (verifyDocId) {
            verify(verifyDocId, true);
            setVerifyDocId(null);
          }
        }}
        title="Verify document"
        description="Confirm this document meets KYC requirements. This will update the customer's KYC status."
        confirmLabel="Verify"
        variant="primary"
        loading={verifyLoading}
      />

      <PromptModal
        open={rejectDocId !== null}
        onClose={() => setRejectDocId(null)}
        onSubmit={handleRejectSubmit}
        title="Reject document"
        description="Provide a reason so the agent knows what to fix."
        label="Rejection reason"
        placeholder="e.g. Image is blurry or document expired"
        confirmLabel="Reject document"
        loading={verifyLoading}
      />
    </div>
  );
}
