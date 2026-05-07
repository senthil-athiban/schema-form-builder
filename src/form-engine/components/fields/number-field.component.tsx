import type { BaseFieldProps } from "../../../shared/types/field";

export const NumberField: React.FC<BaseFieldProps> = ({
    field,
    register,
    disabled,
    error,
  }) => {
    return (
      <input
        type="number"
        id={field.id}
        {...register(field.name, { valueAsNumber: true })}
        placeholder={field.placeholder}
        disabled={disabled}
        min={field.config?.min}
        max={field.config?.max}
        step={field.config?.step || 1}
        className={`form-input ${error ? 'error' : ''} ${field.styles?.className || ''}`}
        style={{
          width: '100%',
          padding: '0.625rem 0.75rem',
          fontSize: '0.875rem',
          border: error ? '1px solid #EF4444' : '1px solid #D1D5DB',
          borderRadius: '0.375rem',
          outline: 'none',
          transition: 'border-color 0.2s',
          ...field.styles?.customCSS,
        }}
        onFocus={(e) => {
          if (!error) e.currentTarget.style.borderColor = '#3B82F6';
        }}
        onBlur={(e) => {
          if (!error) e.currentTarget.style.borderColor = '#D1D5DB';
        }}
      />
    );
  };