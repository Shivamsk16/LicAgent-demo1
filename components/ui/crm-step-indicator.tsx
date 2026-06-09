"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function CRMStepIndicator({
  steps,
  currentStep,
  label,
  compact = false,
}: {
  steps: readonly { id: number; label: string }[];
  currentStep: number;
  label: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <nav
        aria-label={label}
        className="flex h-14 shrink-0 items-center border-b border-black/[0.08] bg-lic-neutral-0 px-5"
      >
        <ol className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
          {steps.map((step, index) => {
            const done = index < currentStep;
            const active = index === currentStep;
            return (
              <li key={step.id} className="flex shrink-0 items-center">
                {index > 0 && (
                  <ChevronRight
                    className="mx-1 h-3.5 w-3.5 shrink-0 text-lic-neutral-300"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    active && "bg-lic-blue-50 text-lic-blue-700",
                    done && !active && "text-lic-neutral-700",
                    !active && !done && "text-lic-neutral-400"
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "tabular-nums",
                      active ? "text-lic-blue-600" : "text-lic-neutral-400"
                    )}
                  >
                    {index + 1}
                  </span>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav
      aria-label={label}
      className="shrink-0 border-b border-black/[0.06] bg-lic-neutral-25/50 px-6 py-4 sm:px-8"
    >
      <ol className="flex flex-wrap items-center gap-2 sm:gap-0">
        {steps.map((step, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          return (
            <li key={step.id} className="flex items-center">
              {index > 0 && (
                <span
                  className={cn(
                    "mx-2 hidden h-px w-6 sm:block sm:w-10",
                    done ? "bg-lic-blue-400" : "bg-lic-neutral-200"
                  )}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-[13px]",
                  active && "bg-lic-blue-50 text-lic-blue-700 ring-1 ring-lic-blue-200",
                  done && !active && "text-lic-neutral-700",
                  !active && !done && "text-lic-neutral-400"
                )}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                    active && "bg-lic-blue-500 text-white",
                    done && !active && "bg-lic-blue-400 text-white",
                    !active && !done && "bg-lic-neutral-100 text-lic-neutral-500"
                  )}
                >
                  {index + 1}
                </span>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
