import { useState, useEffect, useCallback, startTransition } from "react";
import type {
  FieldValues,
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import {
  areConditionsMet,
  getTargetFieldIds,
  getVisibleQuestionIds,
} from "@form-builder/shared/form-validation";
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
  const visible = getVisibleQuestionIds(schema, formData);

  const enabled = new Set(questions.filter((f) => !f.disabled).map((f) => f.id));
  schema.conditionalLogic?.forEach((rule) => {
    const conditionsMet = areConditionsMet(rule.conditions, formData);
    rule.actions.forEach((action) => {
      if (action.type !== "enable" && action.type !== "disable") return;
      const shouldEnable = action.type === "enable" ? conditionsMet : !conditionsMet;
      getTargetFieldIds(action.targetFieldId).forEach((targetId) => {
        if (shouldEnable) enabled.add(targetId);
        else enabled.delete(targetId);
      });
    });
  });

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
            shouldValidate: true,
          });
        });
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
