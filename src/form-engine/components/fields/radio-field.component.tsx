import type { BaseFieldProps } from "../../../shared/types/field";

export const RadioField: React.FC<BaseFieldProps> = ({
    field,
    register,
    disabled,
  }) => {
    return (
      <div className="radio-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {field.config?.options?.map((option) => (
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
              type="radio"
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