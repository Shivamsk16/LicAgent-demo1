"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  onCloseAttempt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  onCloseAttempt?: () => boolean;
}) {
  const requestClose = useCallback(() => {
    if (onCloseAttempt && !onCloseAttempt()) return;
    onOpenChange(false);
  }, [onCloseAttempt, onOpenChange]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, requestClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-modal flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-lic-neutral-900/25 backdrop-blur-[1px]"
        onClick={requestClose}
        aria-label="Close panel"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex h-full w-full max-w-lg flex-col bg-lic-neutral-0 shadow-xl ring-1 ring-black/[0.08] sm:max-w-xl",
          "animate-in slide-in-from-right duration-200",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-lic-neutral-900">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-[13px] text-lic-neutral-500">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={requestClose}
            aria-label="Close"
            className="shrink-0"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-thin sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
