import { z } from "zod";
import type { FormField } from '../../shared/types/form';
import type { EngineQuestion } from "./helpers";
export const createZodSchema = (
  questions: EngineQuestion[],
  visibleFields: Set<string>,
) => {
  const shape: Record<string, z.ZodTypeAny> = {};

  questions.forEach((field) => {
      if (!visibleFields.has(field.id)) {
          return;
      }

      let zodField = createFieldZodSchema(field);

      if (!field.required) {
        zodField = zodField.optional();
      }

      shape[field.name] = zodField;
  });

  return z.object(shape);
};

const createFieldZodSchema = (field: FormField): z.ZodTypeAny => {
  let zodSchema: z.ZodTypeAny;

  switch (field.type) {
    case "email": {
      let emailSchema: z.ZodString = z.string();
      if (field.required) {
        emailSchema = emailSchema.min(
          1,
          getValidationMessage(field, "required"),
        );
      }
      emailSchema = emailSchema.email(
        getValidationMessage(field, "email") || "Invalid email address",
      );
      zodSchema = emailSchema;
      break;
    }

    case "number": {
      let numberSchema: z.ZodNumber = z.coerce.number({
        required_error: getValidationMessage(field, "required"),
        invalid_type_error: "Must be a number",
      });

      if (field.config?.min !== undefined) {
        numberSchema = numberSchema.min(
          field.config.min,
          getValidationMessage(field, "min") ||
            `Minimum value is ${field.config.min}`,
        );
      }

      if (field.config?.max !== undefined) {
        numberSchema = numberSchema.max(
          field.config.max,
          getValidationMessage(field, "max") ||
            `Maximum value is ${field.config.max}`,
        );
      }

      zodSchema = numberSchema;
      break;
    }

    case "url": {
      let urlSchema: z.ZodString = z.string();
      if (field.required) {
        urlSchema = urlSchema.min(1, getValidationMessage(field, "required"));
      }
      urlSchema = (urlSchema as z.ZodString).url(
        getValidationMessage(field, "url") || "Invalid URL",
      );
      zodSchema = urlSchema;
      break;
    }

    case "phone": {
      let phoneSchema: z.ZodString = z.string();
      if (field.required) {
        phoneSchema = phoneSchema.min(
          1,
          getValidationMessage(field, "required"),
        );
      }
      phoneSchema = (phoneSchema as z.ZodString).regex(
        /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
        getValidationMessage(field, "pattern") || "Invalid phone number",
      );

      zodSchema = phoneSchema;
      break;
    }

    case "date": {
      zodSchema = z.coerce.date({
        required_error: getValidationMessage(field, "required"),
        invalid_type_error: "Invalid date",
      });
      break;
    }

    case "checkbox": {
      let checkboxSchema: z.ZodTypeAny;
      if (field.config?.options && field.config.options.length > 0) {
        // Multiple checkboxes - array
        checkboxSchema = z.array(z.string());
        if (field.required) {
          checkboxSchema = (checkboxSchema as z.ZodArray<z.ZodString>).min(
            1,
            getValidationMessage(field, "required") ||
              "Select at least one option",
          );
        }
      } else {
        // Single checkbox - boolean
        checkboxSchema = z.boolean();
        if (field.required) {
          checkboxSchema = (checkboxSchema as z.ZodBoolean).refine(
            (val) => val === true,
            getValidationMessage(field, "required") || "This field is required",
          );
        }
      }
      zodSchema = checkboxSchema;
      break;
    }

    case "multiselect": {
      let multiselectSchema: z.ZodTypeAny = z.array(z.string());
      if (field.required) {
        multiselectSchema = (multiselectSchema as z.ZodArray<z.ZodString>).min(
          1,
          getValidationMessage(field, "required") ||
            "Select at least one option",
        );
      }
      zodSchema = multiselectSchema;
      break;
    }

    case "file": {
      let fileSchema: z.ZodTypeAny = z.any();
      if (field.required) {
        fileSchema = fileSchema.refine(
          (val) => val && (val instanceof File || val instanceof FileList),
          getValidationMessage(field, "required") || "File is required",
        );
      }

      if (field.config?.maxSize) {
        fileSchema = fileSchema.refine(
          (val) => {
            if (!val) return true;
            const file = val instanceof FileList ? val[0] : val;
            return file.size <= (field.config?.maxSize || Infinity);
          },
          `File size must be less than ${formatFileSize(field.config.maxSize)}`,
        );
      }
      zodSchema = fileSchema;
      break;
    }

    default: {
      let defaultSchema: z.ZodTypeAny = z.string();

      if (field.required) {
        defaultSchema = (defaultSchema as z.ZodString).min(
          1,
          getValidationMessage(field, "required"),
        );
      }

      // Apply config constraints
      if (field.config?.minLength) {
        defaultSchema = (defaultSchema as z.ZodString).min(
          field.config.minLength,
          getValidationMessage(field, "min") ||
            `Minimum ${field.config.minLength} characters required`,
        );
      }

      if (field.config?.maxLength) {
        defaultSchema = (defaultSchema as z.ZodString).max(
          field.config.maxLength,
          getValidationMessage(field, "max") ||
            `Maximum ${field.config.maxLength} characters allowed`,
        );
      }

      if (field.config?.pattern) {
        defaultSchema = (defaultSchema as z.ZodString).regex(
          new RegExp(field.config.pattern),
          getValidationMessage(field, "pattern") || "Invalid format",
        );
      }

      zodSchema = defaultSchema;
      break;
    }
  }

  if (field.validation?.rules) {
    field.validation.rules.forEach((rule) => {
      switch (rule.type) {
        case 'pattern':
          if (zodSchema instanceof z.ZodString) {
            zodSchema = zodSchema.regex(new RegExp(String(rule.value)), rule.message);
          }
          break;

        case 'custom':
          zodSchema = zodSchema.refine(
            (val) => {
              // Here you can implement custom validation logic
              const customValidator = getCustomValidator(String(rule.value));
              return customValidator ? customValidator(val) : true;
            },
            rule.message
          );
          break;

        // Other rule types are already handled above
      }
    });
  }

  return zodSchema;
};

// Helper to get validation message from field.validation.rules
const getValidationMessage = (
  field: FormField,
  ruleType: string,
): string | undefined => {
  const rule = field.validation?.rules?.find((r) => r.type === ruleType);
  return rule?.message;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const getCustomValidator = (
  validatorName: string,
): ((value: unknown) => boolean) | undefined => {
  void validatorName;
  return undefined;
};
