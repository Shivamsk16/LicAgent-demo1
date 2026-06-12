"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Customer } from "@/types/business";

export type CreateCustomerPayload = Record<string, unknown>;

export type CreateCustomerResult = {
  customer: Customer;
  duplicate: boolean;
};

async function createCustomer(
  payload: CreateCustomerPayload
): Promise<CreateCustomerResult> {
  const submissionId = crypto.randomUUID();
  const res = await fetch("/api/customers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Submission-Id": submissionId,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error?.message ?? "Failed to create customer");
  }

  return {
    customer: json.data as Customer,
    duplicate: Boolean(json.duplicate),
  };
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
