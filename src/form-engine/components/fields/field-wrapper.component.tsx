interface FieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  width?: "25%" | "50%" | "75%" | "100%";
  styles?: {
    className?: string;
    customCSS?: Record<string, string>;
  };
  children: React.ReactNode;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  label,
  required,
  error,
  width = "100%",
  styles,
  children,
}) => {
  return (
    <div
      className={`field-wrapper ${styles?.className || ""}`}
      style={{
        width: width,
        marginBottom: "1.5rem",
        ...styles?.customCSS,
      }}
    >
      <label
        className="field-label"
        style={{
          display: "block",
          marginBottom: "0.5rem",
          fontWeight: "500",
          fontSize: "0.875rem",
          color: "#374151",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "#EF4444", marginLeft: "0.25rem" }}>*</span>
        )}
      </label>

      {children}

      {error && (
        <p
          style={{
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            color: "#EF4444",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};
