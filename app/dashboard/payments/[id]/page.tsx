import { PageHeader } from "@/components/shared/page-header";
import { PaymentReceipt } from "@/components/payments/payment-receipt";

export default function PaymentReceiptPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <>
      <PageHeader title="Payment receipt" />
      <PaymentReceipt paymentId={params.id} />
    </>
  );
}
