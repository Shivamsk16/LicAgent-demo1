"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";
import { PolicyForm } from "@/components/policies/policy-form";

export function PolicyFormDrawer({
  open,
  onOpenChange,
  prefillCustomerId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillCustomerId?: string | null;
}) {
  const router = useRouter();
  const dirtyRef = useRef(false);

  const handleDirtyChange = useCallback((isDirty: boolean) => {
    dirtyRef.current = isDirty;
  }, []);

  function handleCloseAttempt() {
    if (!dirtyRef.current) return true;
    return window.confirm(
      "You have unsaved changes. Close without saving?"
    );
  }

  function handleSuccess(policyId: string) {
    dirtyRef.current = false;
    onOpenChange(false);
    router.push(`/dashboard/policies/${policyId}`);
    router.refresh();
  }

  function handleCancel() {
    if (!handleCloseAttempt()) return;
    dirtyRef.current = false;
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add policy"
      description="Attach a new policy to an existing customer"
      onCloseAttempt={handleCloseAttempt}
    >
      <PolicyForm
        prefillCustomerId={prefillCustomerId}
        embedded
        showCancel
        onDirtyChange={handleDirtyChange}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />
    </Sheet>
  );
}
