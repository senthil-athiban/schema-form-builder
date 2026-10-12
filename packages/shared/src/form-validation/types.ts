export type FieldType =
  | "text"
  | "email"
  | "number"
  | "textarea"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "date"
  | "time"
  | "file"
  | "rating"
  | "slider"
  | "phone"
  | "url"
  | "section"
  | "html";

export interface FieldOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface FieldConfig {
  options?: FieldOption[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface FieldValidationRule {
  type: "required" | "email" | "url" | "pattern" | "min" | "max" | "custom";
  value?: unknown;
  message: string;
}

export interface FormQuestion {
  id: string;
  type: FieldType;
  label: string;
  name: string;
  required: boolean;
  hidden?: boolean;
  disabled?: boolean;
  defaultValue?: unknown;
  config?: FieldConfig;
  validation?: { rules?: FieldValidationRule[] };
}

export interface FormSection {
  id: string;
  label: string;
  order: number;
  questions: FormQuestion[];
  hidden?: boolean;
}

export interface FormPage {
  id: string;
  label: string;
  sections: FormSection[];
  order: number;
  hidden?: boolean;
}

export type ConditionOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "greaterThan"
  | "lessThan"
  | "isEmpty"
  | "isNotEmpty";

export interface Condition {
  fieldId: string;
  operator: ConditionOperator;
  value: unknown;
  logic?: "AND" | "OR";
}

export interface Action {
  type: "show" | "hide" | "enable" | "disable" | "setValue";
  targetFieldId: string;
  value?: unknown;
}

export interface ConditionalRule {
  id: string;
  sourceFieldId: string;
  conditions: Condition[];
  actions: Action[];
}

export interface FormSchema {
  id: string;
  version: string;
  pages: FormPage[];
  conditionalLogic?: ConditionalRule[];
}
