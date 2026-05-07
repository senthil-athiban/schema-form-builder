export interface BaseFieldProps {
  field: FormField;
  register: UseFormRegister<unknown>;
  control?: Control<unknown>;
  disabled?: boolean;
  error?: boolean;
}
