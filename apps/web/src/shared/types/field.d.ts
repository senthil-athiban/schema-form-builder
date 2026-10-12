import type { Control, FieldValues, UseFormRegister } from "react-hook-form";
import type { FieldConfig, FieldType, FormField } from "./form";

export interface BaseFieldProps {
  field: FormField;
  register: UseFormRegister<FieldValues>;
  control?: Control<FieldValues>;
  disabled?: boolean;
  error?: boolean;
}

export type BuilderDragData = {
  kind?: "palette-field" | "section" | "question-sortable";
  field?: {
    type: FieldType;
    label: string;
    defaultConfig: FieldConfig;
  };
  pageId?: string;
  sectionId?: string;
  questionId?: string;
};
