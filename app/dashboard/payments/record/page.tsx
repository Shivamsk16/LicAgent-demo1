import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentRecordForm } from "@/components/payments/payment-record-form";

export default function RecordPaymentPage() {
  return (
    <>
      <PageHeader title="Record payment" />
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <PaymentRecordForm />
      </Suspense>
    </>
  );
}
