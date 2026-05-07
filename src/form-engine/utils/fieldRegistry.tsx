// utils/fieldRegistry.tsx

import type { FieldType } from "../../shared/types";
import type { BaseFieldProps } from "../../shared/types/field";
import { TextField, CheckboxField, DateField, EmailField, MultiSelectField, NumberField, RadioField, SelectField, TextareaField, TimeField } from "../components/fields";

export const FieldRegistry: Record<FieldType, React.ComponentType<BaseFieldProps>> = {
  text: TextField,
  email: EmailField,
  number: NumberField,
  textarea: TextareaField,
  select: SelectField,
  multiselect: MultiSelectField,
  radio: RadioField,
  checkbox: CheckboxField,
  date: DateField,
  time: TimeField,
//   file: FileField,
//   rating: RatingField,
//   slider: SliderField,
//   phone: PhoneField,
//   url: URLField,
//   section: SectionField,
//   html: HTMLField,
};

export const getFieldComponent = (type: FieldType) => {
  const Component = FieldRegistry[type];
  if (!Component) {
    console.error(`Unknown field type: ${type}`);
    return TextField; // Fallback
  }
  return Component;
};