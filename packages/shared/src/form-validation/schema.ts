import { z } from "zod";
import type { FieldValidationRule, FormQuestion, FormSchema } from "./types.js";
import { getAllQuestions, getVisibleQuestionIds } from "./visibility.js";

export const REQUIRED_MESSAGE = "This field is required";

const PHONE_RE = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
// <input type="time"> sends HH:MM (or HH:MM:SS)
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

const ruleMessage = (question: FormQuestion, type: FieldValidationRule["type"]) =>
  question.validation?.rules?.find((rule) => rule.type === type)?.message;

const toRegExp = (pattern: unknown): RegExp | null => {
  try {
    return new RegExp(String(pattern));
  } catch {
    return null;
  }
};

const optionValues = (question: FormQuestion) =>
  new Set((question.config?.options ?? []).map((option) => String(option.value)));

const hasOptions = (question: FormQuestion) => (question.config?.options?.length ?? 0) > 0;

const withPatternRules = (schema: z.ZodType<string>, question: FormQuestion): z.ZodType<string> => {
  let result = schema;
  for (const rule of question.validation?.rules ?? []) {
    if (rule.type !== "pattern" || rule.value === undefined) continue;
    const re = toRegExp(rule.value);
    if (re) result = result.refine((value) => re.test(value), { message: rule.message || "Invalid format" });
  }
  return result;
}

const textSchema = (question: FormQuestion): z.ZodType<string> => {
  let schema = z.string({ error: "Must be text" });
  const { minLength, maxLength, pattern } = question.config ?? {};
  if (minLength) {
    schema = schema.min(minLength, ruleMessage(question, "min") ?? `Minimum ${minLength} characters required`);
  }
  if (maxLength) {
    schema = schema.max(maxLength, ruleMessage(question, "max") ?? `Maximum ${maxLength} characters allowed`);
  }
  const re = pattern ? toRegExp(pattern) : null;
  if (re) schema = schema.regex(re, ruleMessage(question, "pattern") ?? "Invalid format");
  return withPatternRules(schema, question);
}

const choiceValue = z.union([z.string(), z.number()], { error: "Invalid choice" });

const singleChoiceSchema = (question: FormQuestion) => {
  const allowed = optionValues(question);
  return choiceValue.refine((value) => allowed.size === 0 || allowed.has(String(value)), {
    message: "Select a valid option",
  });
}

const choiceListSchema = (question: FormQuestion) => {
  const allowed = optionValues(question);
  return z
    .array(choiceValue, { error: "Must be a list of options" })
    .refine((values) => allowed.size === 0 || values.every((value) => allowed.has(String(value))), {
      message: "Select valid options",
    });
}

const formatSchema = (question: FormQuestion): z.ZodType => {
  switch (question.type) {
    case "email":
      return withPatternRules(
        z.email({ error: ruleMessage(question, "email") ?? "Invalid email address" }),
        question,
      );

    case "url":
      return withPatternRules(z.url({ error: ruleMessage(question, "url") ?? "Invalid URL" }), question);

    case "phone":
      return z
        .string({ error: "Must be text" })
        .regex(PHONE_RE, ruleMessage(question, "pattern") ?? "Invalid phone number");

    case "number": {
      let schema = z.coerce.number({ error: "Must be a number" });
      const { min, max } = question.config ?? {};
      if (min !== undefined) schema = schema.min(min, ruleMessage(question, "min") ?? `Minimum value is ${min}`);
      if (max !== undefined) schema = schema.max(max, ruleMessage(question, "max") ?? `Maximum value is ${max}`);
      return schema;
    }

    case "date":
      return z.coerce.date({ error: "Invalid date" });

    case "time":
      return z.string({ error: "Must be text" }).regex(TIME_RE, "Invalid time");

    case "select":
    case "radio":
      return singleChoiceSchema(question);

    case "multiselect":
      return choiceListSchema(question);

    case "checkbox":
      return hasOptions(question) ? choiceListSchema(question) : z.boolean({ error: "Must be true or false" });

    case "file":
    case "rating":
    case "slider":
    case "section":
    case "html":
      return z.any();

    default:
      // text, textarea
      return textSchema(question);
  }
}

const isAnswered = (question: FormQuestion, value: unknown) =>
  question.type === "checkbox" && typeof value === "boolean" ? value : !isEmptyValue(value);

export const buildFieldSchema = (question: FormQuestion, required: boolean): z.ZodType => {
  const format = formatSchema(question);

  if (required) {
    const message = ruleMessage(question, "required") ?? REQUIRED_MESSAGE;
    return z
      .unknown()
      .refine((value) => isAnswered(question, value), { message, abort: true })
      .pipe(format);
  }

  return z.preprocess((value) => (isEmptyValue(value) ? undefined : value), format.optional());
}

export const buildSubmissionSchema = (questions: FormQuestion[], visibleIds: Set<string>) => {
  const shape: Record<string, z.ZodType> = {};
  for (const question of questions) {
    if (visibleIds.has(question.id)) shape[question.id] = buildFieldSchema(question, question.required);
  }
  return z.object(shape);
}

export type SubmissionValidationResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; fieldErrors: Record<string, string> };

export const validateSubmission =(
  schema: FormSchema,
  responseData: Record<string, unknown>,
): SubmissionValidationResult => {
  const visibleIds = getVisibleQuestionIds(schema, responseData);
  const result = buildSubmissionSchema(getAllQuestions(schema), visibleIds).safeParse(responseData);

  if (result.success) return { success: true, data: result.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "responseData");
    fieldErrors[key] ??= issue.message;
  }
  return { success: false, fieldErrors };
}
