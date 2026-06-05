import { PaymentReceipt } from "@/components/payments/payment-receipt";

export default function PaymentReceiptPage({
  params,
}: {
  params: { id: string };
}) {
  return <PaymentReceipt paymentId={params.id} />;
}
