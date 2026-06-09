"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CRMStepIndicator } from "@/components/ui/crm-step-indicator";
import { ModalFooterActions } from "@/components/ui/modal-footer-actions";
import { CustomerFormWizard } from "@/components/customers/customer-form-wizard";
import { focusFormField } from "@/lib/forms/step-validation";
import {
  CUSTOMER_WIZARD_DRAFT_KEY,
  CUSTOMER_WIZARD_STEP_FIELDS,
  CUSTOMER_WIZARD_STEPS,
  customerWizardApiPayload,
  customerWizardDefaultValues,
  customerWizardSchema,
  type CustomerWizardFormValues,
} from "@/lib/forms/customer-wizard-schema";

export function CustomerWizardModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const submittingRef = useRef(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const initialSnapshotRef = useRef("");

  const form = useForm<CustomerWizardFormValues>({
    resolver: zodResolver(customerWizardSchema),
    defaultValues: customerWizardDefaultValues(),
    mode: "onTouched",
  });

  const {
    register,
    reset,
    trigger,
    watch,
    formState: { errors, isDirty },
  } = form;

  const values = watch();
  const isLastStep = step === CUSTOMER_WIZARD_STEPS.length - 1;

  useEffect(() => {
    if (!open) return;

    const defaults = customerWizardDefaultValues();
    let nextValues = defaults;

    try {
      const raw = localStorage.getItem(CUSTOMER_WIZARD_DRAFT_KEY);
      if (raw) {
        nextValues = { ...defaults, ...(JSON.parse(raw) as Partial<CustomerWizardFormValues>) };
      }
    } catch {
      /* ignore invalid draft */
    }

    reset(nextValues);
    initialSnapshotRef.current = JSON.stringify(nextValues);
    setStep(0);
    setSubmitError("");
    setDraftSaved(false);
  }, [open, reset]);

  function handleCloseAttempt() {
    const dirty =
      isDirty || JSON.stringify(values) !== initialSnapshotRef.current;
    if (!dirty) return true;
    return window.confirm(
      "You have unsaved changes. Close without saving?"
    );
  }

  function handleCancel() {
    if (!handleCloseAttempt()) return;
    onOpenChange(false);
  }

  async function validateCurrentStep(): Promise<boolean> {
    const fields = [...CUSTOMER_WIZARD_STEP_FIELDS[step]];
    if (fields.length === 0) return true;
    const valid = await trigger(fields);
    if (!valid) {
      const formErrors = form.formState.errors;
      const firstInvalid = fields.find(
        (f) => formErrors[f as keyof CustomerWizardFormValues]
      );
      focusFormField(firstInvalid ?? fields[0] ?? null);
    }
    return valid;
  }

  async function goNext() {
    const valid = await validateCurrentStep();
    if (!valid) return;
    setStep((s) => Math.min(s + 1, CUSTOMER_WIZARD_STEPS.length - 1));
  }

  function goPrevious() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function saveDraft() {
    localStorage.setItem(CUSTOMER_WIZARD_DRAFT_KEY, JSON.stringify(values));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
  }

  async function saveCustomer() {
    if (submittingRef.current) return;

    const valid = await trigger();
    if (!valid) {
      const formErrors = form.formState.errors;
      const firstStepWithError = CUSTOMER_WIZARD_STEP_FIELDS.findIndex((fields) =>
        fields.some((f) => formErrors[f as keyof CustomerWizardFormValues])
      );
      if (firstStepWithError >= 0) setStep(firstStepWithError);
      focusFormField(Object.keys(formErrors)[0] ?? null);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerWizardApiPayload(values)),
      });
      const json = await res.json();

      if (!json.success) {
        setSubmitError(json.error?.message ?? "Failed to create customer");
        return;
      }

      localStorage.removeItem(CUSTOMER_WIZARD_DRAFT_KEY);
      initialSnapshotRef.current = JSON.stringify(values);
      onSuccess?.();
      onOpenChange(false);
    } catch {
      setSubmitError("Failed to create customer");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onCloseAttempt={handleCloseAttempt}
      preventClose={submitting}
    >
      <DialogContent
        size="crm"
        onInteractOutside={() => {
          handleCloseAttempt();
        }}
      >
        <DialogHeader className="px-5 py-3.5">
          <div>
            <DialogTitle className="text-base">Add Customer</DialogTitle>
            <DialogDescription className="mt-0.5 text-xs">
              Create a new customer profile.
            </DialogDescription>
          </div>
        </DialogHeader>

        <CRMStepIndicator
          steps={CUSTOMER_WIZARD_STEPS}
          currentStep={step}
          label="Customer wizard progress"
          compact
        />

        <DialogBody className="px-5 py-4">
          {draftSaved && (
            <Alert variant="success" className="mb-3">
              Draft saved locally.
            </Alert>
          )}
          <CustomerFormWizard
            step={step}
            register={register}
            errors={errors}
            values={values}
            submitError={submitError}
            formId="customer-wizard-form"
            onSubmit={saveCustomer}
          />
        </DialogBody>

        <DialogFooter className="px-5 py-3">
          <ModalFooterActions
            variant="wizard"
            submitting={submitting}
            onCancel={handleCancel}
            showPrevious={step > 0}
            onPrevious={goPrevious}
            onNext={goNext}
            isLastStep={isLastStep}
            onSave={saveCustomer}
            onSaveDraft={isLastStep ? saveDraft : undefined}
            formId="customer-wizard-form"
            saveLabel="Save"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
