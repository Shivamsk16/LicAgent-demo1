"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const DISMISS_KEY = "lic-onboarding-dismissed";

type ChecklistItem = {
  id: string;
  label: string;
  href: string;
  done: boolean;
};

export function SetupChecklist({
  customerCount,
  policyCount,
  paymentCount,
}: {
  customerCount: number;
  policyCount?: number;
  paymentCount?: number;
}) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(DISMISS_KEY) === "1";
  });

  const items: ChecklistItem[] = [
    {
      id: "customer",
      label: "Add your first customer",
      href: "/dashboard/customers/new",
      done: customerCount > 0,
    },
    {
      id: "policy",
      label: "Create a policy",
      href: "/dashboard/policies/new",
      done: (policyCount ?? 0) > 0,
    },
    {
      id: "payment",
      label: "Record a premium payment",
      href: "/dashboard/payments/record",
      done: (paymentCount ?? 0) > 0,
    },
    {
      id: "reports",
      label: "Explore reports",
      href: "/dashboard/reports",
      done: false,
    },
  ];

  const completed = items.filter((i) => i.done).length;
  const allDone = completed >= 3;

  if (dismissed || allDone) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <section
      className="rounded-xl bg-lic-neutral-0 p-6 ring-1 ring-black/[0.06]"
      aria-labelledby="setup-checklist-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="setup-checklist-title" className="text-sm font-semibold tracking-tight text-lic-neutral-900">
            Get started
          </h2>
          <p className="mt-1 text-[13px] text-lic-neutral-500">
            {completed} of {items.length} complete — set up your workspace in minutes
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={dismiss} aria-label="Dismiss checklist">
          <X className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-lic-neutral-100">
        <div
          className="h-full rounded-full bg-lic-neutral-900 transition-[width] duration-slow ease-out"
          style={{ width: `${(completed / items.length) * 100}%` }}
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={items.length}
        />
      </div>

      <ul className="mt-5 space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors duration-fast ease-out",
                item.done
                  ? "text-lic-neutral-400"
                  : "text-lic-neutral-800 hover:bg-black/[0.04]"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  item.done ? "bg-lic-green-100 text-lic-green-600" : "bg-lic-neutral-100 text-lic-neutral-400"
                )}
                aria-hidden
              >
                {item.done ? (
                  <Check className="h-3 w-3" strokeWidth={2} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-lic-neutral-300" />
                )}
              </span>
              <span className={cn("flex-1", item.done && "line-through")}>{item.label}</span>
              {!item.done && (
                <ChevronRight className="h-4 w-4 text-lic-neutral-400" strokeWidth={1.75} />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
