import { z } from "zod";
import { apiError } from "@/lib/api/response";
import { zodValidationError } from "@/lib/validation/customer";

export function validationApiError(result: z.ZodSafeParseError<unknown>) {
  const { message, field } = zodValidationError(result);
  return apiError("VALIDATION_ERROR", message, 400, field);
}
