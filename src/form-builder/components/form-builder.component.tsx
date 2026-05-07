
import React, { useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Eye, Settings, Download, Upload, Undo, Redo, Trash2, Save } from 'lucide-react';
import { useFormBuilderStore } from '../store/form-builder-store';
import { FieldsPalette } from './fields-palette.component';
import Canvas from './canvas.component';
import { PropertyPanel } from './property-panel.component';
import { FormSettings } from './form-settings.component';
import { FormRenderer } from '../../form-engine/components/form-renderer';

export const FormBuilder: React.FC = () => {
  const {
    currentForm,
    addField,
    reorderFields,
    mode,
    setMode,
    undo,
    redo,
    history,
    resetForm,
    exportSchema,
  } = useFormBuilderStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Dragging from palette to canvas
    if (active.id.toString().startsWith('palette-')) {
      const fieldData = active.data.current?.field;
      if (fieldData) {
        addField({
          type: fieldData.type,
          label: fieldData.label,
          name: `${fieldData.type}_${Date.now()}`,
          config: fieldData.defaultConfig,
        });
      }
      return;
    }

    // Reordering within canvas
    if (active.id !== over.id) {
      const oldIndex = currentForm.fields.findIndex((f) => f.id === active.id);
      const newIndex = currentForm.fields.findIndex((f) => f.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderFields(oldIndex, newIndex);
      }
    }
  };

  const handleExport = () => {
    const schema = exportSchema();
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.metadata.title.replace(/\s+/g, '_').toLowerCase()}_schema.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const schema = JSON.parse(event.target?.result as string);
            useFormBuilderStore.getState().setForm(schema);
          } catch (error) {
            alert('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSave = () => {
    // This would typically save to a database
    console.log('Saving form:', exportSchema());
    alert('Form saved successfully!');
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the form? This cannot be undone.')) {
      resetForm();
    }
  };

  const iconButtonClass =
    'flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300';
  const toolButtonClass =
    'flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50';

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Top Bar */}
      <div className="flex min-h-[64px] items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-900">📋 Form Builder</h1>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            {currentForm.fields.length} fields
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Toggle */}
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setMode('edit')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                mode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                mode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Eye size={16} />
              Preview
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={undo}
            disabled={history.past.length === 0}
            title="Undo"
            className={iconButtonClass}
          >
            <Undo size={16} />
          </button>

          <button
            onClick={redo}
            disabled={history.future.length === 0}
            title="Redo"
            className={iconButtonClass}
          >
            <Redo size={16} />
          </button>

          <div className="h-8 w-px bg-slate-200" />

          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Form Settings"
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              showSettings
                ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Settings size={16} />
            Settings
          </button>

          <button
            onClick={handleImport}
            title="Import JSON"
            className={toolButtonClass}
          >
            <Upload size={16} />
            Import
          </button>

          <button
            onClick={handleExport}
            title="Export JSON"
            className={toolButtonClass}
          >
            <Download size={16} />
            Export
          </button>

          <button
            onClick={handleClear}
            title="Clear Form"
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-red-500 transition hover:bg-red-50"
          >
            <Trash2 size={16} />
          </button>

          <div className="h-8 w-px bg-slate-200" />

          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <Save size={16} />
            Save Form
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {mode === 'edit' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Left: Fields Palette */}
            <FieldsPalette />

            {/* Center: Canvas */}
            <Canvas />

            {/* Right: Property Panel or Settings */}
            {showSettings ? (
              <div className="h-full w-[350px] overflow-y-auto border-l border-slate-200 bg-slate-50">
                <div className="border-b border-slate-200 bg-white px-6 py-5">
                  <h3 className="text-base font-semibold text-slate-900">
                    Form Settings
                  </h3>
                </div>
                <FormSettings />
              </div>
            ) : (
              <PropertyPanel />
            )}

            <DragOverlay>
              {activeId ? (
                <div className="rounded-xl border-2 border-indigo-500 bg-white px-4 py-3 text-sm font-medium text-indigo-700 shadow-xl opacity-90">
                  Dragging...
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          // Preview Mode
          <div className="flex-1 overflow-y-auto bg-white p-8">
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  📋 <strong>Preview Mode:</strong> This is how your form will look to users. Switch to Edit mode to make changes.
                </p>
              </div>

              <FormRenderer
                schema={currentForm}
                onSubmit={(data) => {
                  console.log('Form submitted:', data);
                  alert('Form submitted! Check console for data.');
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};