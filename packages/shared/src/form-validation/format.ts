import type { FormQuestion } from "./types.js";
import { isEmptyValue } from "./schema.js";

const NON_ANSWER_TYPES = new Set<FormQuestion["type"]>(["section", "html"]);

export function getAnswerQuestions<Q extends FormQuestion>(schema: {
  pages: { sections: { questions: Q[] }[] }[];
}): Q[] {
  return schema.pages
    .flatMap((page) => page.sections.flatMap((section) => section.questions))
    .filter((question) => !NON_ANSWER_TYPES.has(question.type));
}

const optionLabel = (question: FormQuestion, value: unknown): string => {
  const option = question.config?.options?.find((o) => String(o.value) === String(value));
  return option?.label ?? String(value);
};

export function formatAnswer(question: FormQuestion, value: unknown): string {
  if (isEmptyValue(value)) return "";

  switch (question.type) {
    case "select":
    case "radio":
      return optionLabel(question, value);

    case "multiselect":
      return Array.isArray(value) ? value.map((v) => optionLabel(question, v)).join(", ") : String(value);

    case "checkbox":
      if (Array.isArray(value)) return value.map((v) => optionLabel(question, v)).join(", ");
      return value === true || value === "true" ? "Yes" : "No";

    case "date": {
      const date = new Date(String(value));
      return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
    }

    default:
      if (typeof value === "object") {
        try {
          return JSON.stringify(value);
        } catch {
          return "";
        }
      }
      return String(value);
  }
}
