// src/features/form-builder/components/CanvasField.tsx

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Trash2, GripVertical, EyeOff } from 'lucide-react';
import { useFormBuilderStore } from '../store/form-builder-store';
import type { FormQuestion } from '../../shared/types';

interface CanvasFieldProps {
  question: FormQuestion;
  pageId: string;
  sectionId: string;
}

export const CanvasField: React.FC<CanvasFieldProps> = ({ question, pageId, sectionId }) => {
  const {
    selection,
    setSelection,
    deleteQuestion,
  } = useFormBuilderStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected =
  selection?.type === "question" &&
  selection.pageId === pageId &&
  selection.sectionId === sectionId &&
  selection.questionId === question.id;

  const getFieldTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      text: '📝',
      email: '📧',
      number: '🔢',
      textarea: '📄',
      select: '📋',
      multiselect: '☑️',
      radio: '🔘',
      checkbox: '✅',
      date: '📅',
      time: '🕐',
    };
    return icons[type] || '📝';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer rounded-2xl bg-white p-4 transition-all ${
        isSelected
          ? 'border-2 border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
          : isDragging
          ? 'border border-slate-200 shadow-lg'
          : 'border border-slate-200 hover:border-indigo-200 hover:shadow-sm'
      }`}
      onClick={() => setSelection({ type: 'question', pageId, sectionId, questionId: question.id })}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={20} />
        </div>

        {/* Field Icon */}
        <div className="mt-0.5 text-2xl">
          {getFieldTypeIcon(question.type)}
        </div>

        {/* Field Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900">
              {question.label}
            </h4>
            {question.required && (
              <span className="text-xs font-semibold text-red-500">
                *Required
              </span>
            )}
            {question.hidden && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                <EyeOff size={12} />
                Hidden
              </span>
            )}
          </div>
          <p className="my-1 text-xs text-slate-500">
            {question.type.charAt(0).toUpperCase() + question.type.slice(1)} • {question.name}
          </p>
          {question.placeholder && (
            <p className="my-1 text-xs italic text-slate-400">
              Placeholder: {question.placeholder}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className="mt-0.5 flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            // onClick={() => duplicateField(field.id)}
            title="Duplicate field"
            className="flex items-center rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this field?')) {
                deleteQuestion(pageId, sectionId, question.id);
              }
            }}
            title="Delete field"
            className="flex items-center rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Field Preview - Show config info */}
      {question.config?.options && question.config.options.length > 0 && (
        <div className="ml-10 mt-3 rounded-md bg-slate-50 p-2 text-xs text-slate-500">
          <strong>Options:</strong>{' '}
          {question.config.options.slice(0, 3).map((opt) => opt.label).join(', ')}
          {question.config.options.length > 3 && ` +${question.config.options.length - 3} more`}
        </div>
      )}
    </div>
  );
};