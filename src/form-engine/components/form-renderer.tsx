import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FormSchema } from '../../shared/types';
import { createZodSchema } from '../utils/schemaToZod';
import { useConditionalLogic } from '../hooks/useConditionalLogic';
import { getFieldComponent } from '../utils/fieldRegistry';
import { FieldWrapper } from './fields/field-wrapper.component';

interface FormRendererProps {
  schema: FormSchema;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  initialData?: Record<string, any>;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  onSubmit,
  initialData = {},
}) => {
  // Get default values from schema
  const defaultValues = useMemo(() => {
    const values: Record<string, any> = { ...initialData };
    schema.fields.forEach((field) => {
      if (field.defaultValue !== undefined && !initialData[field.name]) {
        values[field.name] = field.defaultValue;
      }
    });
    return values;
  }, [schema.fields, initialData]);

  // Initialize with all fields visible (we'll filter in render)
  const initialVisibleFields = useMemo(() => {
    return new Set(schema.fields.filter((f) => !f.hidden).map((f) => f.id));
  }, [schema.fields]);

  const initialZodSchema = useMemo(() => {
    return createZodSchema(schema, initialVisibleFields);
  }, [schema, initialVisibleFields]);

  const formMethods = useForm({
    defaultValues,
    resolver: zodResolver(initialZodSchema),
    mode: 'onTouched',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    control,
    clearErrors,
  } = formMethods;

  // Watch all form values for conditional logic
  const formData = watch();

  // Handle conditional logic
  const { visibleFields, enabledFields } = useConditionalLogic({
    schema,
    formData,
  });

  // Update Zod schema when visible fields change
  const currentZodSchema = useMemo(() => {
    return createZodSchema(schema, visibleFields);
  }, [schema, visibleFields]);

  useEffect(() => {
    schema.conditionalLogic?.forEach((rule) => {
      const conditionsMet = rule.conditions.every((condition) => {
        const field = schema.fields.find((f) => f.id === condition.fieldId);
        if (!field) return false;

        const fieldValue = formData[field.name];

        switch (condition.operator) {
          case 'equals':
            return fieldValue === condition.value;
          case 'notEquals':
            return fieldValue !== condition.value;
          case 'contains':
            return String(fieldValue || '').includes(String(condition.value));
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
          if (action.type === 'setValue') {
            const targetField = schema.fields.find(
              (f) => f.id === action.targetFieldId
            );
            if (targetField) {
              setValue(targetField.name, action.value);
            }
          }
        });
      }
    });
  }, [formData, schema, setValue]);

  // Clear errors for hidden fields
  useEffect(() => {
    schema.fields.forEach((field) => {
      if (!visibleFields.has(field.id) && errors[field.name]) {
        clearErrors(field.name);
      }
    });
  }, [visibleFields, errors, clearErrors, schema.fields]);

  const onFormSubmit = handleSubmit(async (data) => {
    try {
      // Validate with current Zod schema (for visible fields only)
      const validatedData = currentZodSchema.parse(data);

      await onSubmit(validatedData);

      if (schema.settings.notifications?.success) {
        console.log(schema.settings.notifications.success);
      }
    } catch (error: any) {
      if (error.errors) {
        // Set Zod validation errors
        error.errors.forEach((err: any) => {
          const fieldName = err.path[0];
          formMethods.setError(fieldName, {
            type: 'manual',
            message: err.message,
          });
        });
      }

      if (schema.settings.notifications?.error) {
        console.error(schema.settings.notifications.error);
      }
    }
  });

  // Sort fields by order
  const sortedFields = useMemo(
    () => [...schema.fields].sort((a, b) => a.order - b.order),
    [schema.fields]
  );

  return (
    <form onSubmit={onFormSubmit} className="form-renderer" noValidate>
      <div className="form-header">
        <h2>{schema.metadata.title}</h2>
        {schema.metadata.description && (
          <p className="form-description">{schema.metadata.description}</p>
        )}
      </div>

      <div className="form-fields">
        {sortedFields.map((field) => {
          if (!visibleFields.has(field.id)) {
            return null;
          }

          const FieldComponent = getFieldComponent(field.type);
          const isDisabled = field.disabled || !enabledFields.has(field.id);
          const fieldError = errors[field.name]?.message as string | undefined;

          return (
            <FieldWrapper
              key={field.id}
              label={field.label}
              required={field.required}
              error={fieldError}
              width={field.width}
              styles={field.styles}
            >
              <FieldComponent
                field={field}
                register={register}
                control={control}
                disabled={isDisabled}
                error={!!fieldError}
              />
            </FieldWrapper>
          );
        })}
      </div>

      <div
        className={`form-actions align-${
          schema?.settings?.submitButton?.position || 'center'
        }`}
      >
        <button type="submit" disabled={isSubmitting} className="submit-button">
          {isSubmitting
            ? 'Submitting...'
            : schema?.settings?.submitButton?.label || 'Submit'}
        </button>
      </div>
    </form>
  );
};