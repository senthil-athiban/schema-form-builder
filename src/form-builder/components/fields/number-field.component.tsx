// src/features/form-builder/panels/NumberFieldPanel.tsx

import React, { useCallback } from 'react';
import type { FormField, FormQuestion, WidthType } from '../../../shared/types';
import { useFormBuilderStore } from '../../store/form-builder-store';

interface NumberFieldPanelProps {
  field: FormField;
}

export const NumberFieldPanel: React.FC<NumberFieldPanelProps> = ({ field }) => {
  const { updateQuestion, selection } = useFormBuilderStore();
  const updateCurrentQuestion = useCallback((updates: Partial<FormQuestion>) => {
    if (selection?.type !== "question") return;
    updateQuestion(selection.pageId, selection.sectionId, field.id, updates);
  },[field.id, selection, updateQuestion]);
  
  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-4';
  const labelClass = 'mb-2 block text-xs font-medium text-slate-700';
  const sectionTitleClass = 'mb-4 text-sm font-semibold text-slate-900';

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
            onChange={(e) => updateCurrentQuestion({ label: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="mb-4">
          <label className={labelClass}>Field Name</label>
          <input
            type="text"
            value={field.id}
            onChange={(e) => updateCurrentQuestion({ name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
            className={`${inputClass} font-mono`}
          />
        </div>

        <div className="mb-4">
          <label className={labelClass}>Placeholder</label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => updateCurrentQuestion({ placeholder: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="mb-4">
          <label className={labelClass}>Default Value</label>
          <input
            type="number"
            value={field.defaultValue == null ? '' : String(field.defaultValue)}
            onChange={(e) => updateCurrentQuestion({ defaultValue: e.target.value ? parseFloat(e.target.value) : '' })}
            className={inputClass}
          />
        </div>

        <div className="mb-4">
          <label className={labelClass}>Width</label>
          <select
            value={field.width || '100%'}
            onChange={(e) => updateCurrentQuestion({ width: e.target.value as WidthType })}
            className={inputClass}
          >
            <option value="25%">25%</option>
            <option value="50%">50%</option>
            <option value="75%">75%</option>
            <option value="100%">100%</option>
          </select>
        </div>
      </section>

      {/* Number Configuration */}
      <section>
        <h4 className={sectionTitleClass}>Number Configuration</h4>

        <div className="mb-4">
          <label className={labelClass}>Minimum Value</label>
          <input
            type="number"
            value={field.config?.min ?? ''}
            onChange={(e) =>
              updateCurrentQuestion({
                config: { ...field.config, min: e.target.value ? parseFloat(e.target.value) : undefined },
              })
            }
            className={inputClass}
          />
        </div>

        <div className="mb-4">
          <label className={labelClass}>Maximum Value</label>
          <input
            type="number"
            value={field.config?.max ?? ''}
            onChange={(e) =>
              updateCurrentQuestion({
                config: { ...field.config, max: e.target.value ? parseFloat(e.target.value) : undefined },
              })
            }
            className={inputClass}
          />
        </div>

        <div className="mb-4">
          <label className={labelClass}>Step</label>
          <input
            type="number"
            value={field.config?.step ?? 1}
            onChange={(e) =>
              updateCurrentQuestion({
                config: { ...field.config, step: e.target.value ? parseFloat(e.target.value) : 1 },
              })
            }
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-500">Increment/decrement value</p>
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
              onChange={(e) => updateCurrentQuestion({ required: e.target.checked })}
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
              onChange={(e) => updateCurrentQuestion({ disabled: e.target.checked })}
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
              onChange={(e) => updateCurrentQuestion({ hidden: e.target.checked })}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Hidden by default</span>
          </label>
        </div>
      </section>
    </div>
  );
};