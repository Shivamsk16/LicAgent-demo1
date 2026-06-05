import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentRecordForm } from "@/components/payments/payment-record-form";

export default function RecordPaymentPage() {
  return (
    <>
      <PageHeader
        title="Record payment"
        description="Record a premium payment against an active policy"
        backHref="/dashboard/payments"
        backLabel="Back to payments"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Payments", href: "/dashboard/payments" },
          { label: "Record payment" },
        ]}
      />
      <Suspense fallback={<p className="text-sm text-lic-neutral-500">Loading…</p>}>
        <PaymentRecordForm />
      </Suspense>
    </>
  );
}
