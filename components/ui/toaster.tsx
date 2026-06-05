"use client";

import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Loader2 } from "lucide-react";
import { useToastStore } from "@/lib/toast";
import { cn } from "@/lib/utils/cn";

const variantStyles = {
  default: "ring-black/[0.08] bg-lic-neutral-0",
  success: "ring-lic-green-600/15 bg-lic-green-50",
  error: "ring-lic-red-600/15 bg-lic-red-50",
  warning: "ring-lic-amber-600/15 bg-lic-amber-50",
  info: "ring-lic-blue-500/15 bg-lic-blue-50",
};

const variantIcons = {
  default: null,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const variantIconColors = {
  default: "text-lic-neutral-500",
  success: "text-lic-green-600",
  error: "text-lic-red-600",
  warning: "text-lic-amber-600",
  info: "text-lic-blue-500",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-toast flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t, i) => {
        const variant = t.variant ?? "default";
        const Icon = variantIcons[variant];
        const isLoading = t.duration === 0;
        return (
          <div
            key={t.id}
            role="status"
            style={{ animationDelay: `${i * 40}ms` }}
            className={cn(
              "flex items-start gap-3 rounded-xl px-4 py-3.5 shadow-md ring-1 animate-fade-in",
              variantStyles[variant]
            )}
          >
            {isLoading ? (
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-lic-blue-500" strokeWidth={1.75} />
            ) : Icon ? (
              <Icon
                className={cn("mt-0.5 h-4 w-4 shrink-0", variantIconColors[variant])}
                strokeWidth={1.75}
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-lic-neutral-900">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-lic-neutral-600">{t.description}</p>
              )}
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="mt-2 text-xs font-medium text-lic-blue-600 hover:text-lic-blue-700 hover:underline"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            {!isLoading && (
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-1 text-lic-neutral-400 transition-colors duration-fast hover:bg-black/[0.04] hover:text-lic-neutral-700"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
