import { useDraggable } from "@dnd-kit/core";
import type { FieldConfig, FieldType } from "../../shared/types";

interface FieldDefinition {
  type: FieldType;
  label: string;
  icon: string;
  description: string;
  defaultConfig: FieldConfig;
}

const FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    type: "text",
    label: "Text Input",
    icon: "📝",
    description: "Single line text input",
    defaultConfig: { maxLength: 255 },
  },
  {
    type: "email",
    label: "Email",
    icon: "📧",
    description: "Email address input",
    defaultConfig: { maxLength: 255 },
  },
  {
    type: "number",
    label: "Number",
    icon: "🔢",
    description: "Numeric input",
    defaultConfig: { min: 0, step: 1 },
  },
  {
    type: "textarea",
    label: "Text Area",
    icon: "📄",
    description: "Multi-line text input",
    defaultConfig: { minLength: 10, maxLength: 1000 },
  },
  {
    type: "select",
    label: "Dropdown",
    icon: "📋",
    description: "Select from options",
    defaultConfig: {
      options: [
        { label: "Option 1", value: "option1" },
        { label: "Option 2", value: "option2" },
      ],
    },
  },
  {
    type: "multiselect",
    label: "Multi Select",
    icon: "☑️",
    description: "Select multiple options",
    defaultConfig: {
      options: [
        { label: "Option 1", value: "option1" },
        { label: "Option 2", value: "option2" },
      ],
    },
  },
  {
    type: "radio",
    label: "Radio Group",
    icon: "🔘",
    description: "Choose one option",
    defaultConfig: {
      options: [
        { label: "Option 1", value: "option1" },
        { label: "Option 2", value: "option2" },
      ],
    },
  },
  {
    type: "checkbox",
    label: "Checkbox",
    icon: "✅",
    description: "Multiple selections",
    defaultConfig: {
      options: [
        { label: "Option 1", value: "option1" },
        { label: "Option 2", value: "option2" },
      ],
    },
  },
  {
    type: "date",
    label: "Date",
    icon: "📅",
    description: "Date picker",
    defaultConfig: {},
  },
  {
    type: "time",
    label: "Time",
    icon: "🕐",
    description: "Time picker",
    defaultConfig: {},
  },
];

interface DraggableFieldProps {
  field: FieldDefinition;
  disabled?: boolean;
}

const DraggableField: React.FC<DraggableFieldProps> = ({
  field,
  disabled = false,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${field.type}`,
    data: { field },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...(disabled ? {} : listeners)}
      {...(disabled ? {} : attributes)}
      className={`mb-2 rounded-xl border px-3 py-3 transition-all ${
        disabled
          ? "cursor-not-allowed border-slate-100 bg-slate-100/80 opacity-60"
          : `cursor-grab ${
              isDragging
                ? "border-indigo-200 bg-indigo-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm"
            }`
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{field.icon}</span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-900">{field.label}</div>
          <div className="text-xs text-slate-500">{field.description}</div>
        </div>
      </div>
    </div>
  );
};

interface FieldsPaletteProps {
  /** When false, fields cannot be dragged until the canvas has at least one section. */
  fieldsEnabled?: boolean;
}

export const FieldsPalette: React.FC<FieldsPaletteProps> = ({
  fieldsEnabled = true,
}) => {
  return (
    <aside className="h-full w-72 overflow-y-auto border-r border-slate-200 bg-slate-50/70 p-4">
      <h3 className="mb-1 text-base font-semibold text-slate-900">
        Answers / field types
      </h3>
      <p className="mb-4 text-xs text-slate-500">
        {fieldsEnabled
          ? "Drag fields into a section on the canvas."
          : "Add a page, then a section, before you can drop answers here."}
      </p>
      <div>
        {FIELD_DEFINITIONS.map((field) => (
          <DraggableField
            key={field.type}
            field={field}
            disabled={!fieldsEnabled}
          />
        ))}
      </div>
    </aside>
  );
};
