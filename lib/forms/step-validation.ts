import { z } from "zod";

export type StepValidationResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string>; firstField: string | null };

export function validateStep<T extends z.ZodType>(
  schema: T,
  data: unknown
): StepValidationResult {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true };

  const errors: Record<string, string> = {};
  let firstField: string | null = null;

  for (const issue of result.error.issues) {
    const path = issue.path[0]?.toString();
    if (path && !errors[path]) {
      errors[path] = issue.message;
      if (!firstField) firstField = path;
    }
  }

  return { ok: false, errors, firstField };
}

export function focusFormField(field: string | null) {
  if (!field) return;
  requestAnimationFrame(() => {
    const el = document.getElementById(`field-${field}`);
    if (el && "focus" in el) {
      (el as HTMLElement).focus();
    }
  });
}

export function fieldErrorClass(hasError?: boolean) {
  return hasError
    ? "ring-lic-red-500/60 focus:ring-lic-red-500/40"
    : undefined;
}
