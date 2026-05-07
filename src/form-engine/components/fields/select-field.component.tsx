import type { BaseFieldProps } from "../../../shared/types/field";

export const SelectField: React.FC<BaseFieldProps> = ({
    field,
    register,
    disabled,
    error,
  }) => {
return (
  <select
    id={field.id}
    {...register(field.name)}
    disabled={disabled}
    className={`form-select ${error ? 'error' : ''} ${field.styles?.className || ''}`}
    style={{
      width: '100%',
      padding: '0.625rem 0.75rem',
      fontSize: '0.875rem',
      border: error ? '1px solid #EF4444' : '1px solid #D1D5DB',
      borderRadius: '0.375rem',
      outline: 'none',
      transition: 'border-color 0.2s',
      backgroundColor: 'white',
      cursor: 'pointer',
      ...field.styles?.customCSS,
    }}
    onFocus={(e) => {
      if (!error) e.currentTarget.style.borderColor = '#3B82F6';
    }}
    onBlur={(e) => {
      if (!error) e.currentTarget.style.borderColor = '#D1D5DB';
    }}
  >
    {field.placeholder && (
      <option value="">{field.placeholder}</option>
    )}
    {field.config?.options?.map((option) => (
      <option
        key={option.value}
        value={option.value}
        disabled={option.disabled}
      >
        {option.label}
      </option>
    ))}
  </select>
);
};