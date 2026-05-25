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

export interface FormQuestion {
  id: string;
  type: FieldType;
  label: string;
  name: string;
  required: boolean;
  hidden?: boolean;
  defaultValue?: unknown;
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

export interface FormSchema {
  id: string;
  version: string;
  pages: FormPage[];
}

export type FormSchemaJson = FormSchema;
