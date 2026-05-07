// hooks/useConditionalLogic.ts

import { useState, useEffect } from 'react';
import type { FormSchema } from '../../shared/types/form';

export const useConditionalLogic = ({
  schema,
  formData,
}: {
  schema: FormSchema;
  formData: Record<string, any>;
}) => {
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());
  const [enabledFields, setEnabledFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize with all non-hidden fields
    const visible = new Set(
      schema.fields.filter((f) => !f.hidden).map((f) => f.id)
    );
    const enabled = new Set(
      schema.fields.filter((f) => !f.disabled).map((f) => f.id)
    );

    // Apply conditional logic
    schema.conditionalLogic?.forEach((rule) => {
      const conditionsMet = rule.conditions.every((condition) => {
        const fieldValue = formData[
          schema.fields.find((f) => f.id === condition.fieldId)?.name || ''
        ];

        switch (condition.operator) {
          case 'equals':
            return fieldValue === condition.value;
          case 'notEquals':
            return fieldValue !== condition.value;
          case 'contains':
            return String(fieldValue).includes(String(condition.value));
          case 'greaterThan':
            return Number(fieldValue) > Number(condition.value);
          case 'lessThan':
            return Number(fieldValue) < Number(condition.value);
          case 'isEmpty':
            return !fieldValue || fieldValue === '';
          case 'isNotEmpty':
            return !!fieldValue && fieldValue !== '';
          default:
            return false;
        }
      });

      if (conditionsMet) {
        rule.actions.forEach((action) => {
          switch (action.type) {
            case 'show':
              visible.add(action.targetFieldId);
              break;
            case 'hide':
              visible.delete(action.targetFieldId);
              break;
            case 'enable':
              enabled.add(action.targetFieldId);
              break;
            case 'disable':
              enabled.delete(action.targetFieldId);
              break;
          }
        });
      }
    });

    setVisibleFields(visible);
    setEnabledFields(enabled);
  }, [formData, schema]);

  return { visibleFields, enabledFields };
};