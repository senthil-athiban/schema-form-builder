
import React from 'react';
import { X } from 'lucide-react';
import { useFormBuilderStore } from '../store/form-builder-store';
import { TextFieldPanel } from './fields/text-area-field.component';
import { NumberFieldPanel } from './fields/number-field.component';
import { SelectFieldPanel } from './fields/select-field.component';
import { DateTimeFieldPanel } from './fields/date-time-field.component';

export const PropertyPanel: React.FC = () => {
  const { currentForm, selectedFieldId, selectField } = useFormBuilderStore();

  const selectedField = currentForm.fields.find((f) => f.id === selectedFieldId);

  if (!selectedField) {
    return (
      <aside className="flex h-full w-[350px] items-center justify-center border-l border-slate-200 bg-slate-50 p-6 text-center">
        <div>
          <div className="mb-4 text-5xl">⚙️</div>
          <h3 className="text-base font-medium text-slate-600">No field selected</h3>
          <p className="mt-2 text-sm text-slate-400">
            Click on a field in the canvas to edit its properties
          </p>
        </div>
      </aside>
    );
  }

  const renderFieldPanel = () => {
    switch (selectedField.type) {
      case 'text':
      case 'email':
      case 'textarea':
        return <TextFieldPanel field={selectedField} />;
      case 'number':
        return <NumberFieldPanel field={selectedField} />;
      case 'select':
      case 'multiselect':
      case 'radio':
      case 'checkbox':
        return <SelectFieldPanel field={selectedField} />;
      case 'date':
      case 'time':
        return <DateTimeFieldPanel field={selectedField} />;
      default:
        return <TextFieldPanel field={selectedField} />;
    }
  };

  return (
    <aside className="flex h-full w-[350px] flex-col border-l border-slate-200 bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Field Properties</h3>
          <p className="mt-1 text-xs text-slate-500">
            {selectedField.type.charAt(0).toUpperCase() + selectedField.type.slice(1)}
          </p>
        </div>
        <button
          onClick={() => selectField(null)}
          className="flex items-center rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderFieldPanel()}
      </div>
    </aside>
  );
};