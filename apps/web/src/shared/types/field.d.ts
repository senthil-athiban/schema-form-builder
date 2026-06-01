export interface BaseFieldProps {
  field: FormField;
  register: UseFormRegister<unknown>;
  control?: Control<unknown>;
  disabled?: boolean;
  error?: boolean;
}

type BuilderDragData = {
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