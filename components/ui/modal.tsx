"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils/cn";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  }[size];

  return (
    <dialog
      ref={ref}
      className={cn("modal", sizeClass, className)}
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-6 py-5">
        <div>
          <h2 id="modal-title" className="text-base font-semibold tracking-tight text-lic-neutral-900">{title}</h2>
          {description && (
            <p className="mt-1 text-[13px] text-lic-neutral-500">{description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close dialog"
          className="h-8 w-8 shrink-0"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      </div>
      {children && <div className="px-5 py-4">{children}</div>}
      {footer && (
        <div className="flex items-center justify-end gap-2 border-t border-lic-neutral-200 px-5 py-4">
          {footer}
        </div>
      )}
    </dialog>
  );
}

export function PromptModal({
  open,
  onClose,
  onSubmit,
  title,
  description,
  label,
  placeholder,
  defaultValue = "",
  confirmLabel = "Submit",
  cancelLabel = "Cancel",
  required = true,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  required?: boolean;
  loading?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  function handleSubmit() {
    if (required && !value.trim()) return;
    onSubmit(value.trim());
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading || (required && !value.trim())}
          >
            {loading ? "Processing…" : confirmLabel}
          </Button>
        </>
      }
    >
      <label className="block text-xs font-medium text-lic-neutral-600">
        {label}
        <input
          className="mt-1.5 h-9 w-full rounded-md border border-lic-neutral-200 bg-lic-neutral-0 px-3 text-sm text-lic-neutral-800 focus:border-lic-blue-400 focus:outline-none focus:ring-[3px] focus:ring-lic-blue-400/15"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
        />
      </label>
    </Modal>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing…" : confirmLabel}
          </Button>
        </>
      }
    />
  );
}
