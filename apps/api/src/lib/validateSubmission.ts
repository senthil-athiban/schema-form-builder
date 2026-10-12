import { getAllQuestions, validateSubmission } from "@form-builder/shared/form-validation";
import type { FormSchema } from "../types/form-schema.js";

export class SubmissionValidationError extends Error {
  readonly statusCode = 400;
  readonly fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    super("Submission validation failed");
    this.name = "SubmissionValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function validateSubmissionResponse(
  schema: FormSchema,
  responseData: Record<string, unknown>,
): Record<string, unknown> {
  if (!responseData || typeof responseData !== "object" || Array.isArray(responseData)) {
    throw new SubmissionValidationError({
      responseData: "responseData must be a non-null object",
    });
  }

  const result = validateSubmission(schema, responseData);

  if (!result.success) {
    const labels = new Map(getAllQuestions(schema).map((q) => [q.id, q.label || q.name]));
    const fieldErrors: Record<string, string> = {};
    for (const [fieldId, message] of Object.entries(result.fieldErrors)) {
      const label = labels.get(fieldId);
      fieldErrors[fieldId] = label ? `${label}: ${message}` : message;
    }
    throw new SubmissionValidationError(fieldErrors);
  }

  return JSON.parse(JSON.stringify(result.data)) as Record<string, unknown>;
}
