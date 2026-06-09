"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { CRMModal } from "@/components/ui/crm-modal";
import { ModalFooterActions } from "@/components/ui/modal-footer-actions";
import { INDIAN_STATES } from "@/lib/constants/states";
import { fieldErrorClass, focusFormField } from "@/lib/forms/step-validation";
import type { Customer } from "@/types/business";

const quickCustomerSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
});

type QuickCustomerValues = z.infer<typeof quickCustomerSchema>;

export function CustomerQuickCreateModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: Customer) => void;
}) {
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<QuickCustomerValues>({
    resolver: zodResolver(quickCustomerSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      city: "",
      state: "",
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  async function onSubmit(values: QuickCustomerValues) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          email: "",
          pincode: "",
          pan_number: "",
          aadhaar_last4: "",
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setError("root", {
          message: json.error?.message ?? "Failed to create customer",
        });
        return;
      }

      onCreated(json.data);
      onOpenChange(false);
    } catch {
      setError("root", { message: "Failed to create customer" });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function onInvalid(fieldErrors: typeof errors) {
    const firstField = Object.keys(fieldErrors)[0] ?? null;
    focusFormField(firstField);
  }

  return (
    <CRMModal
      open={open}
      onOpenChange={onOpenChange}
      preventClose={submitting}
      size="default"
      title="New Customer"
      description="Quickly add a customer without leaving the policy wizard."
      footer={
        <ModalFooterActions
          variant="record"
          submitting={submitting}
          onCancel={() => onOpenChange(false)}
          onSave={handleSubmit(onSubmit, onInvalid)}
          saveLabel="Create customer"
        />
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="space-y-4"
        noValidate
      >
        {errors.root && <Alert variant="error">{errors.root.message}</Alert>}

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="field-full_name" required>
              Full name
            </Label>
            <Input
              id="field-full_name"
              {...register("full_name")}
              className={fieldErrorClass(!!errors.full_name)}
              aria-invalid={!!errors.full_name}
            />
            {errors.full_name && (
              <p className="mt-1.5 text-xs text-lic-red-600" role="alert">
                {errors.full_name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="field-phone" required>
              Mobile number
            </Label>
            <Input
              id="field-phone"
              {...register("phone")}
              className={fieldErrorClass(!!errors.phone)}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <p className="mt-1.5 text-xs text-lic-red-600" role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="field-city" required>
              City
            </Label>
            <Input
              id="field-city"
              {...register("city")}
              className={fieldErrorClass(!!errors.city)}
              aria-invalid={!!errors.city}
            />
            {errors.city && (
              <p className="mt-1.5 text-xs text-lic-red-600" role="alert">
                {errors.city.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="field-state" required>
              State
            </Label>
            <Select
              id="field-state"
              containerClassName="w-full"
              {...register("state")}
              className={fieldErrorClass(!!errors.state)}
              aria-invalid={!!errors.state}
            >
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            {errors.state && (
              <p className="mt-1.5 text-xs text-lic-red-600" role="alert">
                {errors.state.message}
              </p>
            )}
          </div>
        </div>
      </form>
    </CRMModal>
  );
}
