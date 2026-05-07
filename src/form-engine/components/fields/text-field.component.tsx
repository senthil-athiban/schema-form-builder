import type { BaseFieldProps } from '../../../shared/types/field';

export const TextField: React.FC<BaseFieldProps> = ({
    field,
    register,
    disabled,
    error,
  }) => {
    return (
      <input
        type="text"
        id={field.id}
        {...register(field.name)}
        placeholder={field.placeholder}
        disabled={disabled}
        minLength={field.config?.minLength}
        maxLength={field.config?.maxLength}
        pattern={field.config?.pattern}
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