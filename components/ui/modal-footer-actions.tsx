"use client";

import { type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type RecordFooterProps = {
  variant: "record";
  submitting?: boolean;
  onCancel: () => void;
  onSave: () => void;
  onSaveAndNew?: () => void;
  saveLabel?: string;
  saveAndNewLabel?: string;
  leftActions?: ReactNode;
};

type WizardFooterProps = {
  variant: "wizard";
  submitting?: boolean;
  onCancel: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  showPrevious?: boolean;
  isLastStep?: boolean;
  onSave?: () => void;
  onSaveAndNew?: () => void;
  onSaveDraft?: () => void;
  saveLabel?: string;
  saveAndNewLabel?: string;
  saveDraftLabel?: string;
  nextLabel?: string;
  leftActions?: ReactNode;
  formId?: string;
};

export type ModalFooterActionsProps = RecordFooterProps | WizardFooterProps;

export function ModalFooterActions(props: ModalFooterActionsProps) {
  const { submitting, onCancel, leftActions } = props;

  if (props.variant === "record") {
    return (
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          {leftActions}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {props.onSaveAndNew && (
            <Button
              type="button"
              variant="secondary"
              onClick={props.onSaveAndNew}
              disabled={submitting}
            >
              {props.saveAndNewLabel ?? "Save & new"}
            </Button>
          )}
          <Button type="button" onClick={props.onSave} disabled={submitting}>
            {submitting && (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
            )}
            {submitting
              ? "Saving…"
              : props.saveLabel ?? "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        {leftActions}
      </div>
      <div className={cn("flex flex-wrap items-center gap-2")}>
        {props.showPrevious && props.onPrevious && (
          <Button
            type="button"
            variant="secondary"
            onClick={props.onPrevious}
            disabled={submitting}
          >
            Previous
          </Button>
        )}
        {props.isLastStep ? (
          <>
            {props.onSaveDraft && (
              <Button
                type="button"
                variant="secondary"
                onClick={props.onSaveDraft}
                disabled={submitting}
              >
                {props.saveDraftLabel ?? "Save draft"}
              </Button>
            )}
            {props.onSaveAndNew && (
              <Button
                type="button"
                variant="secondary"
                onClick={props.onSaveAndNew}
                disabled={submitting}
              >
                {props.saveAndNewLabel ?? "Save & new"}
              </Button>
            )}
            <Button
              type="submit"
              form={props.formId}
              onClick={props.onSave}
              disabled={submitting}
            >
              {submitting && (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
              )}
              {submitting
                ? "Saving…"
                : props.saveLabel ?? "Save"}
            </Button>
          </>
        ) : (
          <Button type="button" onClick={props.onNext} disabled={submitting}>
            {props.nextLabel ?? "Next"}
          </Button>
        )}
      </div>
    </div>
  );
}
