"use client";

import { type ReactNode } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CRMModal({
  open,
  onOpenChange,
  onCloseAttempt,
  preventClose = false,
  title,
  description,
  children,
  footer,
  stepIndicator,
  size = "crm",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAttempt?: () => boolean;
  preventClose?: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
  stepIndicator?: ReactNode;
  size?: "crm" | "default";
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onCloseAttempt={onCloseAttempt}
      preventClose={preventClose}
    >
      <DialogContent
        size={size}
        onInteractOutside={() => {
          onCloseAttempt?.();
        }}
      >
        <DialogHeader>
          <div>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </div>
        </DialogHeader>

        {stepIndicator}

        <DialogBody>{children}</DialogBody>

        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
