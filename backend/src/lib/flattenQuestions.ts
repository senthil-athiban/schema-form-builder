import type { FormQuestion, FormSchema } from "../types/form-schema.js";

export function flattenQuestions(schema: FormSchema): FormQuestion[] {
  return schema.pages.flatMap((page) =>
    page.hidden
      ? []
      : page.sections.flatMap((section) =>
          section.hidden
            ? []
            : section.questions.filter((q) => !q.hidden),
        ),
  );
}
