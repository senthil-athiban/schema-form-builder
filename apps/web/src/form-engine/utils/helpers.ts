import type { FormQuestion, FormSchema } from "@/shared/types";

export type EngineQuestion = FormQuestion & {
  pageId: string;
  sectionId: string;
  pageLabel: string;
  sectionLabel: string;
};

export function flattenQuestions(schema: FormSchema): EngineQuestion[] {
  return schema.pages.flatMap((page) =>
    page.sections.flatMap((section) =>
      section.questions.map((question) => ({
        ...question,
        pageId: page.id,
        sectionId: section.id,
        pageLabel: page.label,
        sectionLabel: section.label,
      })),
    ),
  );
}

export function buildQuestionMap(schema: FormSchema): Record<string, EngineQuestion> {
  return flattenQuestions(schema).reduce((acc, question) => {
    acc[question.id] = question;
    return acc;
  }, {} as Record<string, EngineQuestion>);
}

export function buildDefaultValues(
  schema: FormSchema,
  initialData: Record<string, unknown>,
): Record<string, unknown> {
  return flattenQuestions(schema).reduce((acc, question) => {
    acc[question.id] = initialData[question.id] !== undefined
    ? initialData[question.id]
    : question.defaultValue;
    return acc;
  }, {} as Record<string, unknown>);
}

export function buildSubmissionPayload(
  schema: FormSchema,
  answers: Record<string, unknown>,
) {
  return flattenQuestions(schema).reduce((acc, question) => {
    acc[question.id] = answers[question.id];
    return acc;
  }, {} as Record<string, unknown>);
}
