import type { BaseFieldProps } from "../../../shared/types/field";

export const CheckboxField: React.FC<BaseFieldProps> = ({
    field,
    register,
    disabled,
  }) => {
    // Single checkbox (no options)
    if (!field.config?.options || field.config.options.length === 0) {
      return (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <input
            type="checkbox"
            id={field.id}
            {...register(field.id)}
            disabled={disabled}
            style={{
              width: '1rem',
              height: '1rem',
              marginRight: '0.5rem',
              cursor: disabled ? 'not-allowed' : 'pointer',
              accentColor: '#3B82F6',
            }}
          />
          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
            {field.placeholder || field.label}
          </span>
        </label>
      );
    }
  
    // Multiple checkboxes (checkbox group)
    return (
      <div className="checkbox-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {field.config.options.map((option) => (
          <label
            key={option.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: disabled || option.disabled ? 'not-allowed' : 'pointer',
              opacity: disabled || option.disabled ? 0.5 : 1,
            }}
          >
            <input
              type="checkbox"
              {...register(field.id)}
              value={option.value}
              disabled={disabled || option.disabled}
              style={{
                width: '1rem',
                height: '1rem',
                marginRight: '0.5rem',
                cursor: disabled || option.disabled ? 'not-allowed' : 'pointer',
                accentColor: '#3B82F6',
              }}
            />
            <span style={{ fontSize: '0.875rem', color: '#374151' }}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
    );
  };