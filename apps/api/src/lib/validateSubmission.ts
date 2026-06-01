import { flattenQuestions } from "./flattenQuestions.js";
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

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

export function validateSubmissionResponse(
  schema: FormSchema,
  responseData: Record<string, unknown>,
): void {
  if (!responseData || typeof responseData !== "object" || Array.isArray(responseData)) {
    throw new SubmissionValidationError({
      responseData: "responseData must be a non-null object",
    });
  }

  const fieldErrors: Record<string, string> = {};

  for (const question of flattenQuestions(schema)) {
    if (!question.required) continue;

    const value = responseData[question.id];
    if (question.type === "checkbox" && typeof value === "boolean") {
      if (!value) {
        fieldErrors[question.id] = `${question.label} is required`;
      }
      continue;
    }

    if (isEmptyValue(value)) {
      fieldErrors[question.id] = `${question.label} is required`;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new SubmissionValidationError(fieldErrors);
  }
}
