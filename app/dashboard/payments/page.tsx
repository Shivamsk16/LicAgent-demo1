import { Suspense } from "react";
import dynamic from "next/dynamic";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

const PaymentsLedger = dynamic(
  () =>
    import("@/components/payments/payments-ledger").then((m) => ({
      default: m.PaymentsLedger,
    })),
  {
    loading: () => (
      <div className="section-gap">
        <PageHeaderSkeleton />
        <TableSkeleton rows={10} cols={7} />
      </div>
    ),
  }
);

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="section-gap">
          <PageHeaderSkeleton />
          <TableSkeleton rows={10} cols={7} />
        </div>
      }
    >
      <PaymentsLedger />
    </Suspense>
  );
}
