"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addYears } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { CRMModal } from "@/components/ui/crm-modal";
import { CRMStepIndicator } from "@/components/ui/crm-step-indicator";
import { ModalFooterActions } from "@/components/ui/modal-footer-actions";
import { ReviewSummary, formatLabel } from "@/components/shared/review-summary";
import { CustomerQuickCreateModal } from "@/components/policies/customer-quick-create-modal";
import { formatINR } from "@/lib/utils/currency";
import { formatDateIST } from "@/lib/utils/dates";
import { fieldErrorClass, focusFormField } from "@/lib/forms/step-validation";
import {
  POLICY_WIZARD_DRAFT_KEY,
  POLICY_WIZARD_STEP_FIELDS,
  POLICY_WIZARD_STEPS,
  policyWizardDefaultValues,
  policyWizardPayload,
  policyWizardSchema,
  type PolicyWizardFormValues,
} from "@/lib/forms/policy-wizard-schema";
import type { Customer } from "@/types/business";

const POLICY_TYPES = [
  "endowment",
  "whole_life",
  "term",
  "money_back",
  "ulip",
  "pension",
  "child",
  "group",
];
const FREQUENCIES = ["monthly", "quarterly", "half_yearly", "yearly", "single"];
const PAYMENT_MODES = ["cash", "cheque", "neft", "nach", "upi", "online"];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-lic-red-600" role="alert">
      {message}
    </p>
  );
}

export function PolicyWizardModal({
  open,
  onOpenChange,
  prefillCustomerId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillCustomerId?: string | null;
}) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const initialSnapshotRef = useRef("");

  const [step, setStep] = useState(prefillCustomerId ? 1 : 0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersError, setCustomersError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const form = useForm<PolicyWizardFormValues>({
    resolver: zodResolver(policyWizardSchema),
    defaultValues: policyWizardDefaultValues(prefillCustomerId),
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors, isDirty },
  } = form;

  const values = watch();
  const selectedCustomer = customers.find((c) => c.id === values.customer_id);

  const loadCustomers = useCallback(() => {
    fetch("/api/customers?pageSize=500&sort=full_name&order=asc")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) {
          setCustomersError(j.error?.message ?? "Failed to load customers");
          return;
        }
        setCustomers(j.data?.items ?? []);
        setCustomersError("");
      })
      .catch(() => setCustomersError("Failed to load customers"));
  }, []);

  useEffect(() => {
    if (open) loadCustomers();
  }, [open, loadCustomers]);

  useEffect(() => {
    if (!open) return;
    const defaults = policyWizardDefaultValues(prefillCustomerId);
    let nextValues = defaults;

    try {
      const raw = localStorage.getItem(POLICY_WIZARD_DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<PolicyWizardFormValues>;
        nextValues = { ...defaults, ...draft };
        if (prefillCustomerId) nextValues.customer_id = prefillCustomerId;
      }
    } catch {
      /* ignore invalid draft */
    }

    reset(nextValues);
    initialSnapshotRef.current = JSON.stringify(nextValues);
    setStep(prefillCustomerId ? 1 : 0);
    setSubmitError("");
    setDraftSaved(false);
  }, [open, prefillCustomerId, reset]);

  useEffect(() => {
    const commencement = values.commencement_date;
    const term = values.policy_term_years;
    if (commencement && term && Number(term) > 0) {
      const maturity = addYears(new Date(commencement), Number(term))
        .toISOString()
        .slice(0, 10);
      if (values.maturity_date !== maturity) {
        setValue("maturity_date", maturity, { shouldDirty: true });
      }
    }
  }, [values.commencement_date, values.policy_term_years, values.maturity_date, setValue]);

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
    const fields = [...POLICY_WIZARD_STEP_FIELDS[step]];
    if (fields.length === 0) return true;
    const valid = await trigger(fields);
    if (!valid) {
      const formErrors = form.formState.errors;
      const firstInvalid = fields.find(
        (f) => formErrors[f as keyof PolicyWizardFormValues]
      );
      focusFormField(firstInvalid ?? fields[0] ?? null);
    }
    return valid;
  }

  async function goNext() {
    const valid = await validateCurrentStep();
    if (!valid) return;
    setStep((s) => Math.min(s + 1, POLICY_WIZARD_STEPS.length - 1));
  }

  function goPrevious() {
    setStep((s) => Math.max(s - 1, prefillCustomerId ? 1 : 0));
  }

  function saveDraft() {
    localStorage.setItem(POLICY_WIZARD_DRAFT_KEY, JSON.stringify(values));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
  }

  function handleCustomerCreated(customer: Customer) {
    setCustomers((prev) =>
      [...prev, customer].sort((a, b) => a.full_name.localeCompare(b.full_name))
    );
    setValue("customer_id", customer.id, { shouldDirty: true, shouldValidate: true });
  }

  async function onSubmit() {
    if (submittingRef.current) return;

    const valid = await trigger();
    if (!valid) {
      const formErrors = form.formState.errors;
      const firstStepWithError = POLICY_WIZARD_STEP_FIELDS.findIndex((fields) =>
        fields.some((f) => formErrors[f as keyof PolicyWizardFormValues])
      );
      if (firstStepWithError >= 0) setStep(firstStepWithError);
      focusFormField(Object.keys(formErrors)[0] ?? null);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policyWizardPayload(values)),
      });
      const json = await res.json();

      if (!json.success) {
        setSubmitError(json.error?.message ?? "Failed to create policy");
        return;
      }

      localStorage.removeItem(POLICY_WIZARD_DRAFT_KEY);
      initialSnapshotRef.current = JSON.stringify(values);
      onOpenChange(false);
      router.push(`/dashboard/policies/${json.data.id}`);
      router.refresh();
    } catch {
      setSubmitError("Failed to create policy");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <>
      <CRMModal
        open={open}
        onOpenChange={onOpenChange}
        onCloseAttempt={handleCloseAttempt}
        preventClose={submitting}
        title="New Policy"
        description="Create and attach a policy to an existing customer."
        stepIndicator={
          <CRMStepIndicator
            steps={POLICY_WIZARD_STEPS}
            currentStep={step}
            label="Policy wizard progress"
          />
        }
        footer={
          <ModalFooterActions
            variant="wizard"
            submitting={submitting}
            onCancel={handleCancel}
            showPrevious={step > (prefillCustomerId ? 1 : 0)}
            onPrevious={goPrevious}
            onNext={goNext}
            isLastStep={step === POLICY_WIZARD_STEPS.length - 1}
            formId="policy-wizard-form"
            saveLabel="Save"
            leftActions={
              <Button type="button" variant="secondary" onClick={saveDraft}>
                Save draft
              </Button>
            }
          />
        }
      >
            {customersError && step === 0 && (
              <Alert variant="error" title="Could not load customers" className="mb-5">
                {customersError}
              </Alert>
            )}

            {draftSaved && (
              <Alert variant="success" className="mb-5">
                Draft saved locally. You can resume later from this device.
              </Alert>
            )}

            <form
              id="policy-wizard-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              {step === 0 && (
                <section aria-labelledby="wizard-step-customer">
                  <h3
                    id="wizard-step-customer"
                    className="mb-5 text-sm font-semibold uppercase tracking-wide text-lic-neutral-500"
                  >
                    Customer
                  </h3>
                  <div className="max-w-md space-y-2">
                    <Label htmlFor="field-customer_id" required>
                      Customer
                    </Label>
                    <Select
                      id="field-customer_id"
                      containerClassName="w-full"
                      {...register("customer_id")}
                      className={fieldErrorClass(!!errors.customer_id)}
                      aria-invalid={!!errors.customer_id}
                    >
                      <option value="">Select customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} · {c.phone}
                        </option>
                      ))}
                    </Select>
                    <FieldError message={errors.customer_id?.message} />
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto px-0 text-sm"
                      onClick={() => setCustomerModalOpen(true)}
                    >
                      Create new customer
                    </Button>
                  </div>
                </section>
              )}

              {step === 1 && selectedCustomer && (
                <div className="mb-5 rounded-lg border border-lic-neutral-150 bg-lic-neutral-25 px-4 py-3 text-sm text-lic-neutral-700">
                  <span className="font-medium text-lic-neutral-900">
                    {selectedCustomer.full_name}
                  </span>{" "}
                  · {selectedCustomer.phone} · KYC: {selectedCustomer.kyc_status}
                </div>
              )}

              {step === 1 && (
                <section aria-labelledby="wizard-step-policy">
                  <h3
                    id="wizard-step-policy"
                    className="mb-5 text-sm font-semibold uppercase tracking-wide text-lic-neutral-500"
                  >
                    Policy details
                  </h3>
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-5">
                      <div>
                        <Label htmlFor="field-policy_number" required>
                          Policy number
                        </Label>
                        <Input
                          id="field-policy_number"
                          {...register("policy_number")}
                          className={fieldErrorClass(!!errors.policy_number)}
                          aria-invalid={!!errors.policy_number}
                        />
                        <FieldError message={errors.policy_number?.message} />
                      </div>
                      <div>
                        <Label htmlFor="field-plan_name" required>
                          Plan name
                        </Label>
                        <Input
                          id="field-plan_name"
                          {...register("plan_name")}
                          className={fieldErrorClass(!!errors.plan_name)}
                          aria-invalid={!!errors.plan_name}
                        />
                        <FieldError message={errors.plan_name?.message} />
                      </div>
                      <div>
                        <Label htmlFor="field-policy_type">Plan type</Label>
                        <Select
                          id="field-policy_type"
                          containerClassName="w-full"
                          {...register("policy_type")}
                        >
                          {POLICY_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {formatLabel(t)}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="field-sum_assured" required>
                          Sum assured (₹)
                        </Label>
                        <Input
                          id="field-sum_assured"
                          type="number"
                          min="0"
                          step="1"
                          {...register("sum_assured")}
                          className={fieldErrorClass(!!errors.sum_assured)}
                          aria-invalid={!!errors.sum_assured}
                        />
                        <FieldError message={errors.sum_assured?.message} />
                      </div>
                    </div>
                    <div className="hidden rounded-lg border border-dashed border-lic-neutral-200 bg-lic-neutral-25/60 p-6 md:block">
                      <p className="text-sm font-medium text-lic-neutral-700">
                        Premium details
                      </p>
                      <p className="mt-2 text-sm text-lic-neutral-500">
                        Continue to the next step to enter premium amount, payment
                        frequency, and policy dates.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {step === 2 && (
                <section aria-labelledby="wizard-step-premium">
                  <h3
                    id="wizard-step-premium"
                    className="mb-5 text-sm font-semibold uppercase tracking-wide text-lic-neutral-500"
                  >
                    Premium details
                  </h3>
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="hidden space-y-2 rounded-lg border border-lic-neutral-150 bg-lic-neutral-25 p-5 md:block">
                      <p className="text-xs font-semibold uppercase tracking-wide text-lic-neutral-500">
                        Policy summary
                      </p>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-lic-neutral-500">Policy number</dt>
                          <dd className="font-medium">{values.policy_number || "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-lic-neutral-500">Plan</dt>
                          <dd className="font-medium">{values.plan_name || "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-lic-neutral-500">Sum assured</dt>
                          <dd className="font-medium">
                            {values.sum_assured
                              ? formatINR(Number(values.sum_assured))
                              : "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <Label htmlFor="field-premium_amount" required>
                          Premium amount (₹)
                        </Label>
                        <Input
                          id="field-premium_amount"
                          type="number"
                          min="0"
                          step="1"
                          {...register("premium_amount")}
                          className={fieldErrorClass(!!errors.premium_amount)}
                          aria-invalid={!!errors.premium_amount}
                        />
                        <FieldError message={errors.premium_amount?.message} />
                      </div>
                      <div>
                        <Label htmlFor="field-premium_frequency">
                          Premium frequency
                        </Label>
                        <Select
                          id="field-premium_frequency"
                          containerClassName="w-full"
                          {...register("premium_frequency")}
                        >
                          {FREQUENCIES.map((f) => (
                            <option key={f} value={f}>
                              {formatLabel(f)}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="field-policy_term_years" required>
                          Policy term (years)
                        </Label>
                        <Input
                          id="field-policy_term_years"
                          type="number"
                          min="1"
                          {...register("policy_term_years")}
                          className={fieldErrorClass(!!errors.policy_term_years)}
                          aria-invalid={!!errors.policy_term_years}
                        />
                        <FieldError message={errors.policy_term_years?.message} />
                      </div>
                      <div>
                        <Label htmlFor="field-commencement_date" required>
                          Commencement date
                        </Label>
                        <Input
                          id="field-commencement_date"
                          type="date"
                          {...register("commencement_date")}
                          className={fieldErrorClass(!!errors.commencement_date)}
                          aria-invalid={!!errors.commencement_date}
                        />
                        <FieldError message={errors.commencement_date?.message} />
                      </div>
                      <div>
                        <Label htmlFor="field-maturity_date">Maturity date</Label>
                        <Input
                          id="field-maturity_date"
                          type="date"
                          readOnly
                          value={values.maturity_date}
                          className="bg-lic-neutral-50"
                          tabIndex={-1}
                        />
                      </div>
                      <div>
                        <Label htmlFor="field-mode_of_payment">Payment mode</Label>
                        <Select
                          id="field-mode_of_payment"
                          containerClassName="w-full"
                          {...register("mode_of_payment")}
                        >
                          {PAYMENT_MODES.map((m) => (
                            <option key={m} value={m}>
                              {formatLabel(m)}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {step === 3 && (
                <section aria-labelledby="wizard-step-review">
                  <h3
                    id="wizard-step-review"
                    className="mb-5 text-sm font-semibold uppercase tracking-wide text-lic-neutral-500"
                  >
                    Review
                  </h3>
                  <ReviewSummary
                    sections={[
                      {
                        title: "Customer",
                        rows: [
                          { label: "Name", value: selectedCustomer?.full_name },
                          { label: "Phone", value: selectedCustomer?.phone },
                          {
                            label: "KYC status",
                            value: selectedCustomer?.kyc_status
                              ? formatLabel(selectedCustomer.kyc_status)
                              : null,
                          },
                        ],
                      },
                      {
                        title: "Policy details",
                        rows: [
                          { label: "Policy number", value: values.policy_number },
                          { label: "Plan name", value: values.plan_name },
                          {
                            label: "Plan type",
                            value: formatLabel(values.policy_type),
                          },
                          {
                            label: "Sum assured",
                            value: values.sum_assured
                              ? formatINR(Number(values.sum_assured))
                              : null,
                          },
                        ],
                      },
                      {
                        title: "Premium details",
                        rows: [
                          {
                            label: "Premium amount",
                            value: values.premium_amount
                              ? formatINR(Number(values.premium_amount))
                              : null,
                          },
                          {
                            label: "Frequency",
                            value: formatLabel(values.premium_frequency),
                          },
                          {
                            label: "Term",
                            value: values.policy_term_years
                              ? `${values.policy_term_years} years`
                              : null,
                          },
                          {
                            label: "Commencement",
                            value: values.commencement_date
                              ? formatDateIST(values.commencement_date)
                              : null,
                          },
                          {
                            label: "Maturity",
                            value: values.maturity_date
                              ? formatDateIST(values.maturity_date)
                              : null,
                          },
                          {
                            label: "Payment mode",
                            value: formatLabel(values.mode_of_payment),
                          },
                        ],
                      },
                    ]}
                  />
                  {submitError && (
                    <Alert variant="error" className="mt-4">
                      {submitError}
                    </Alert>
                  )}
                </section>
              )}
            </form>
      </CRMModal>

      <CustomerQuickCreateModal
        open={customerModalOpen}
        onOpenChange={setCustomerModalOpen}
        onCreated={handleCustomerCreated}
      />
    </>
  );
}
