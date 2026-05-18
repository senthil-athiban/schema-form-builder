import { useState, useEffect, useCallback, startTransition } from "react";
import type {
  FieldValues,
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { EngineQuestion } from "../utils/helpers";
import type { FormSchema } from "@/shared/types";

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  let allMatch = true;
  a.forEach((id) => {
    if (!b.has(id)) allMatch = false;
  });
  return allMatch;
}

function computeVisibility(
  schema: FormSchema,
  questions: EngineQuestion[],
  formData: Record<string, unknown>,
): { visible: Set<string>; enabled: Set<string> } {
  // console.log('questions:', questions)
  const visible = new Set(questions.filter((f) => !f.hidden).map((f) => f.id));
  // console.log('visible:', visible)
  const enabled = new Set(
    questions.filter((f) => !f.disabled).map((f) => f.id),
  );
  // console.log('enabled:', enabled)
  schema.conditionalLogic?.forEach((rule) => {
    const conditionsMet = rule.conditions.every((condition) => {
      const fieldValue = formData[condition.fieldId];

      switch (condition.operator) {
        case "equals":
          return fieldValue === condition.value;
        case "notEquals":
          return fieldValue !== condition.value;
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
    });
    // console.log('conditionsMet:', conditionsMet)

    rule.actions.forEach((action) => {
      switch (action.type) {
        case "show":
          if (conditionsMet) visible.add(action.targetFieldId);
          else visible.delete(action.targetFieldId);
          break;
        case "hide":
          if (conditionsMet) visible.delete(action.targetFieldId);
          else visible.add(action.targetFieldId);
          break;
        case "enable":
          if (conditionsMet) enabled.add(action.targetFieldId);
          else enabled.delete(action.targetFieldId);
          break;
        case "disable":
          if (conditionsMet) enabled.delete(action.targetFieldId);
          else enabled.add(action.targetFieldId);
          break;
      }
    });
  });
  // console.log('visible:', visible)
  // console.log('enabled:', enabled)

  return { visible, enabled };
}

export const useConditionalLogic = <T extends FieldValues>({
  schema,
  questions,
  watch,
  getValues,
  setValue,
}: {
  schema: FormSchema;
  questions: EngineQuestion[];
  watch: UseFormWatch<T>;
  getValues: UseFormGetValues<T>;
  setValue: UseFormSetValue<{
    [x: string]: unknown;
  }>;
}) => {
  const [visibleFields, setVisibleFields] = useState<Set<string>>(() => {
    const fd = getValues() as Record<string, unknown>;
    return computeVisibility(schema, questions, fd).visible;
  });
  const [enabledFields, setEnabledFields] = useState<Set<string>>(() => {
    const fd = getValues() as Record<string, unknown>;
    return computeVisibility(schema, questions, fd).enabled;
  });

  const applySetValueActions = useCallback(
    (formData: Record<string, unknown>) => {
      schema.conditionalLogic?.forEach((rule) => {
        const conditionsMet = rule.conditions.every((c) => {
          const fieldValue = formData[c.fieldId];
          switch (c.operator) {
            case "equals":
              return fieldValue === c.value;
            case "notEquals":
              return fieldValue !== c.value;
            case "contains":
              return String(fieldValue).includes(String(c.value));
            case "greaterThan":
              return Number(fieldValue) > Number(c.value);
            case "lessThan":
              return Number(fieldValue) < Number(c.value);
            case "isEmpty":
              return !fieldValue || fieldValue === "";
            case "isNotEmpty":
              return !!fieldValue && fieldValue !== "";
            default:
              return false;
          }
        });
        if (!conditionsMet) return;
        rule.actions.forEach((action) => {
          if (action.type !== "setValue") return;
          const targetFieldId = action.targetFieldId;
          const targetValue = action.value!;
          setValue(targetFieldId, targetValue, {
            shouldDirty: true,
            shouldValidate: true
          })
        })
      });
    },
    [schema.conditionalLogic, setValue],
  );

  const applyFormData = useCallback(
    (formData: Record<string, unknown>) => {
      const { visible, enabled } = computeVisibility(
        schema,
        questions,
        formData,
      );
      setVisibleFields((prev) => (setsEqual(prev, visible) ? prev : visible));
      setEnabledFields((prev) => (setsEqual(prev, enabled) ? prev : enabled));
    },
    [schema, questions],
  );

  useEffect(() => {
    startTransition(() => {
      applyFormData(getValues() as Record<string, unknown>);
    });
    applySetValueActions(getValues() as Record<string, unknown>);

    const subscription = watch((value) => {
      startTransition(() => {
        applyFormData((value ?? {}) as Record<string, unknown>);
      });

      applySetValueActions(value);
    });

    return () => subscription.unsubscribe();
  }, [watch, getValues, applyFormData, applySetValueActions]);

  return { visibleFields, enabledFields };
};
