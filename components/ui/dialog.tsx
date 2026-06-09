"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

type DialogContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAttempt?: () => boolean;
  preventClose: boolean;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within Dialog");
  return ctx;
}

export function Dialog({
  open,
  onOpenChange,
  onCloseAttempt,
  preventClose = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAttempt?: () => boolean;
  preventClose?: boolean;
  children: ReactNode;
}) {
  return (
    <DialogContext.Provider
      value={{ open, onOpenChange, onCloseAttempt, preventClose }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export function DialogContent({
  children,
  className,
  size = "default",
  onInteractOutside,
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "wizard" | "crm";
  onInteractOutside?: () => void;
}) {
  const { open, onOpenChange, onCloseAttempt, preventClose } = useDialogContext();
  const ref = useRef<HTMLDialogElement>(null);

  const requestClose = useCallback(() => {
    if (preventClose) return;
    if (onCloseAttempt && !onCloseAttempt()) return;
    onOpenChange(false);
  }, [preventClose, onCloseAttempt, onOpenChange]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleCancel(e: Event) {
      e.preventDefault();
      requestClose();
    }

    el.addEventListener("cancel", handleCancel);
    return () => el.removeEventListener("cancel", handleCancel);
  }, [requestClose]);

  const sizeClass =
    size === "crm"
      ? "dialog-crm"
      : size === "wizard"
        ? "dialog-wizard"
        : "max-w-lg";

  const innerClass =
    size === "crm" || size === "wizard"
      ? "flex h-full min-h-0 flex-col"
      : "flex max-h-[inherit] min-h-0 flex-col";

  return (
    <dialog
      ref={ref}
      className={cn("dialog", sizeClass, className)}
      aria-modal="true"
      onClick={(e) => {
        if (e.target === ref.current) {
          onInteractOutside?.();
          requestClose();
        }
      }}
    >
      <div className={innerClass}>{children}</div>
    </dialog>
  );
}

export function DialogHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { onOpenChange, onCloseAttempt, preventClose } = useDialogContext();

  function handleClose() {
    if (preventClose) return;
    if (onCloseAttempt && !onCloseAttempt()) return;
    onOpenChange(false);
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-black/[0.08] bg-lic-neutral-0 px-5 py-3.5",
        className
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClose}
        disabled={preventClose}
        aria-label="Close"
        className="h-9 w-9 shrink-0"
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </Button>
    </div>
  );
}

export function DialogTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-base font-semibold tracking-tight text-lic-neutral-900",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function DialogDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mt-0.5 text-xs text-lic-neutral-500", className)}>
      {children}
    </p>
  );
}

export function DialogBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto px-5 py-4 scrollbar-thin",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 w-full shrink-0 border-t border-black/[0.08] bg-lic-neutral-0 px-5 py-3",
        className
      )}
    >
      {children}
    </div>
  );
}
