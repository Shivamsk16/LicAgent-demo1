"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateIST } from "@/lib/utils/dates";
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

  const { data, isLoading } = useQuery({
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
      qc.invalidateQueries({ queryKey: ["kyc", customerId] });
      qc.invalidateQueries({ queryKey: ["customer", customerId] });
      e.currentTarget.reset();
    } else {
      alert(json.error?.message ?? "Upload failed");
    }
  }

  async function verify(docId: string, verified: boolean) {
    const rejection_reason = verified
      ? undefined
      : prompt("Rejection reason?") ?? "Rejected";
    if (!verified && !rejection_reason) return;

    const res = await fetch(`/api/customers/${customerId}/kyc/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified, rejection_reason }),
    });
    if (res.ok) {
      qc.invalidateQueries({ queryKey: ["kyc", customerId] });
      qc.invalidateQueries({ queryKey: ["customer", customerId] });
    }
  }

  async function viewDoc(docId: string) {
    const res = await fetch(`/api/customers/${customerId}/kyc/${docId}`);
    const json = await res.json();
    if (json.success && json.data?.url) window.open(json.data.url, "_blank");
    else alert(json.error?.message ?? "Could not open document");
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

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Status: <Badge>{data?.kyc_status ?? "pending"}</Badge>
      </p>

      {canUpload && (
        <form onSubmit={upload} className="flex flex-wrap items-end gap-3 rounded-card border bg-white p-4">
          <select name="doc_type" className="h-9 rounded-btn border px-2 text-sm" required>
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
          <input
            type="file"
            name="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            required
            className="text-sm"
          />
          <Button type="submit" size="sm">Upload</Button>
          <p className="w-full text-xs text-lic-neutral-500">JPG, PNG, PDF · max 5MB</p>
        </form>
      )}

      <ul className="space-y-2">
        {(data?.documents ?? []).length === 0 && (
          <li className="text-sm text-lic-neutral-500">No documents uploaded.</li>
        )}
        {(data?.documents ?? []).map((doc) => (
          <li
            key={doc.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-card border bg-white p-3 text-sm"
          >
            <div>
              <span className="font-medium">{doc.file_name}</span>
              <span className="ml-2 text-xs text-lic-neutral-500">
                {doc.doc_type.replace(/_/g, " ")} · {formatDateIST(doc.created_at)}
              </span>
              {doc.verified && <Badge className="ml-2">Verified</Badge>}
              {doc.rejection_reason && !doc.verified && (
                <span className="ml-2 text-lic-red-600 text-xs">{doc.rejection_reason}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => viewDoc(doc.id)}>
                View
              </Button>
              {canVerify && !doc.verified && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => verify(doc.id, true)}>
                    Verify
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => verify(doc.id, false)}>
                    Reject
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
