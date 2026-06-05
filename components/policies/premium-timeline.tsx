"use client";

import { Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Payment } from "@/types/business";

export function PremiumTimeline({
  totalInstallments,
  payments,
}: {
  totalInstallments: number;
  payments: Payment[];
}) {
  const paidSet = new Set(
    payments.filter((p) => p.status === "paid").map((p) => p.installment_number)
  );
  const count = Math.min(totalInstallments || 12, 24);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-2">
        {Array.from({ length: count }, (_, i) => {
          const n = i + 1;
          const paid = paidSet.has(n);
          return (
            <div
              key={n}
              className={cn(
                "flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-full border text-xs",
                paid
                  ? "border-lic-green-600 bg-lic-green-100 text-lic-green-600"
                  : "border-lic-neutral-200 bg-white text-lic-neutral-500"
              )}
              title={`Installment ${n}`}
            >
              {paid ? <Check className="h-4 w-4" /> : n <= (payments[0]?.installment_number ?? 0) ? <X className="h-3 w-3 text-lic-red-600" /> : <Circle className="h-3 w-3" />}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-lic-neutral-500">
        Green = paid · Gray = upcoming (showing up to {count} installments)
      </p>
    </div>
  );
}
