import type { Condition, FormQuestion, FormSchema } from "./types.js";

export function getAllQuestions(schema: FormSchema): FormQuestion[] {
  return schema.pages.flatMap((page) => page.sections.flatMap((section) => section.questions));
}

const valuesMatch = (fieldValue: unknown, expected: unknown) =>
  fieldValue === expected ||
  (typeof fieldValue === "number" && String(fieldValue) === String(expected));

export function evaluateCondition(condition: Condition, values: Record<string, unknown>): boolean {
  const fieldValue = values[condition.fieldId];

  switch (condition.operator) {
    case "equals":
      return valuesMatch(fieldValue, condition.value);
    case "notEquals":
      return !valuesMatch(fieldValue, condition.value);
    case "contains":
      return String(fieldValue).includes(String(condition.value));
    case "greaterThan":
      return Number(fieldValue) > Number(condition.value);
    case "lessThan":
      return Number(fieldValue) < Number(condition.value);
    case "isEmpty":
      return !fieldValue || fieldValue === "";
    case "isNotEmpty":
      return !!fieldValue && fieldValue !== "";
    default:
      return false;
  }
}

export function areConditionsMet(conditions: Condition[], values: Record<string, unknown>): boolean {
  return conditions.reduce((acc, condition, idx) => {
    const result = evaluateCondition(condition, values);
    if (idx === 0) return result;
    return condition.logic === "OR" ? acc || result : acc && result;
  }, false);
}

export const getTargetFieldIds = (targetFieldId: string): string[] =>
  targetFieldId.split(",").map((id) => id.trim()).filter(Boolean);

export function getVisibleQuestionIds(schema: FormSchema, values: Record<string, unknown>): Set<string> {
  const visible = new Set<string>();
  for (const page of schema.pages) {
    if (page.hidden) continue;
    for (const section of page.sections) {
      if (section.hidden) continue;
      for (const question of section.questions) {
        if (!question.hidden) visible.add(question.id);
      }
    }
  }

  for (const rule of schema.conditionalLogic ?? []) {
    const conditionsMet = areConditionsMet(rule.conditions, values);

    for (const action of rule.actions) {
      if (action.type !== "show" && action.type !== "hide") continue;
      const shouldShow = action.type === "show" ? conditionsMet : !conditionsMet;
      for (const targetId of getTargetFieldIds(action.targetFieldId)) {
        if (shouldShow) visible.add(targetId);
        else visible.delete(targetId);
      }
    }
  }

  return visible;
}
