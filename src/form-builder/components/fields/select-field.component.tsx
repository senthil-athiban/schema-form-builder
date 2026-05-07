

import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { FormField } from '../../../shared/types';
import { useFormBuilderStore } from '../../store/form-builder-store';

interface SelectFieldPanelProps {
  field: FormField;
}

export const SelectFieldPanel: React.FC<SelectFieldPanelProps> = ({ field }) => {
  const { updateField } = useFormBuilderStore();
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');
  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-4';
  const labelClass = 'mb-2 block text-xs font-medium text-slate-700';
  const sectionTitleClass = 'mb-4 text-sm font-semibold text-slate-900';

  const options = field.config?.options || [];

  const addOption = () => {
    if (!newOptionLabel.trim()) return;

    const value = newOptionValue.trim() || newOptionLabel.toLowerCase().replace(/\s+/g, '_');
    
    const newOptions = [
      ...options,
      {
        label: newOptionLabel.trim(),
        value: value,
        disabled: false,
      },
    ];

    updateField(field.id, {
      config: { ...field.config, options: newOptions },
    });

    setNewOptionLabel('');
    setNewOptionValue('');
  };

  const updateOption = (index: number, updates: Partial<typeof options[0]>) => {
    const newOptions = options.map((opt, i) =>
      i === index ? { ...opt, ...updates } : opt
    );
    updateField(field.id, {
      config: { ...field.config, options: newOptions },
    });
  };

  const deleteOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    updateField(field.id, {
      config: { ...field.config, options: newOptions },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Basic Settings */}
      <section>
        <h4 className={sectionTitleClass}>Basic Settings</h4>

        <div className="mb-4">
          <label className={labelClass}>Label</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => updateField(field.id, { label: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="mb-4">
          <label className={labelClass}>Field Name</label>
          <input
            type="text"
            value={field.name}
            onChange={(e) => updateField(field.id, { name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
            className={`${inputClass} font-mono`}
          />
        </div>

        {field.type === 'select' && (
          <div className="mb-4">
            <label className={labelClass}>Placeholder</label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
              className={inputClass}
            />
          </div>
        )}

        <div className="mb-4">
          <label className={labelClass}>Width</label>
          <select
            value={field.width || '100%'}
            onChange={(e) => updateField(field.id, { width: e.target.value as any })}
            className={inputClass}
          >
            <option value="25%">25%</option>
            <option value="50%">50%</option>
            <option value="75%">75%</option>
            <option value="100%">100%</option>
          </select>
        </div>
      </section>

      {/* Options */}
      <section>
        <h4 className={sectionTitleClass}>Options</h4>

        {/* Existing Options */}
        <div className="mb-4">
          {options.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              No options added yet. Add options below.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {options.map((option, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <GripVertical size={16} className="cursor-grab text-slate-400" />
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => updateOption(index, { label: e.target.value })}
                      placeholder="Option label"
                      className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-2"
                    />
                    <button
                      onClick={() => deleteOption(index)}
                      className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex gap-2 pl-6">
                    <input
                      type="text"
                      value={option.value}
                      onChange={(e) => updateOption(index, { value: e.target.value })}
                      placeholder="Value"
                      className="flex-1 rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 font-mono text-xs outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-2"
                    />
                    <label className="flex items-center gap-1 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={option.disabled || false}
                        onChange={(e) => updateOption(index, { disabled: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Disabled
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Option */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className="mb-2 block text-xs font-medium text-slate-700">Add New Option</label>
          <input
            type="text"
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            placeholder="Option label"
            onKeyPress={(e) => e.key === 'Enter' && addOption()}
            className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-2"
          />
          <input
            type="text"
            value={newOptionValue}
            onChange={(e) => setNewOptionValue(e.target.value)}
            placeholder="Value (optional, auto-generated)"
            onKeyPress={(e) => e.key === 'Enter' && addOption()}
            className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1.5 font-mono text-xs outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-2"
          />
          <button
            onClick={addOption}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-2 py-2 text-xs font-medium text-white transition hover:bg-indigo-700"
          >
            <Plus size={14} />
            Add Option
          </button>
        </div>
      </section>

      {/* Validation */}
      <section>
        <h4 className={sectionTitleClass}>Validation</h4>

        <div className="mb-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => updateField(field.id, { required: e.target.checked })}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Required field</span>
          </label>
        </div>
      </section>

      {/* Display Options */}
      <section>
        <h4 className={sectionTitleClass}>Display Options</h4>

        <div className="mb-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={field.disabled || false}
              onChange={(e) => updateField(field.id, { disabled: e.target.checked })}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Disabled</span>
          </label>
        </div>

        <div className="mb-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={field.hidden || false}
              onChange={(e) => updateField(field.id, { hidden: e.target.checked })}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Hidden by default</span>
          </label>
        </div>
      </section>
    </div>
  );
};