import React from 'react';
import { useFormBuilderStore } from '../store/form-builder-store';

export const FormSettings: React.FC = () => {
  const { currentForm, updateFormMetadata, updateFormSettings } = useFormBuilderStore();

  return (
    <div className="space-y-6 p-6">
      {/* Metadata */}
      <section>
        <h4 className="mb-4 text-sm font-semibold text-slate-900">Form Information</h4>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-slate-700">Form Title</label>
          <input
            type="text"
            value={currentForm.metadata.title}
            onChange={(e) => updateFormMetadata({ title: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-4"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-slate-700">Description</label>
          <textarea
            value={currentForm.metadata.description || ''}
            onChange={(e) => updateFormMetadata({ description: e.target.value })}
            rows={3}
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-4"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-slate-700">Author</label>
          <input
            type="text"
            value={currentForm.metadata.author || ''}
            onChange={(e) => updateFormMetadata({ author: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-4"
          />
        </div>
      </section>

      {/* Settings */}
      <section>
        <h4 className="mb-4 text-sm font-semibold text-slate-900">Form Settings</h4>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-slate-700">Theme</label>
          <select
            value={currentForm.settings.theme || 'modern'}
            onChange={(e) => updateFormSettings({ theme: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-4"
          >
            <option value="modern">Modern</option>
            <option value="classic">Classic</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
      </section>

      {/* Submit Button */}
      <section>
        <h4 className="mb-4 text-sm font-semibold text-slate-900">Submit Button</h4>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-slate-700">Button Label</label>
          <input
            type="text"
            value={currentForm.settings.submitButton?.label || 'Submit'}
            onChange={(e) =>
              updateFormSettings({
                submitButton: {
                  ...currentForm.settings.submitButton,
                  label: e.target.value,
                  position: currentForm.settings.submitButton?.position || 'center',
                },
              })
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-4"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-slate-700">Button Position</label>
          <select
            value={currentForm.settings.submitButton?.position || 'center'}
            onChange={(e) =>
              updateFormSettings({
                submitButton: {
                  ...currentForm.settings.submitButton,
                  label: currentForm.settings.submitButton?.label || 'Submit',
                  position: e.target.value as 'left' | 'center' | 'right',
                },
              })
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-4"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </section>

      {/* Notifications */}
      <section>
        <h4 className="mb-4 text-sm font-semibold text-slate-900">Notifications</h4>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-slate-700">Success Message</label>
          <textarea
            value={currentForm.settings.notifications?.success || ''}
            onChange={(e) =>
              updateFormSettings({
                notifications: {
                  ...currentForm.settings.notifications,
                  success: e.target.value,
                },
              })
            }
            rows={2}
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-4"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-slate-700">Error Message</label>
          <textarea
            value={currentForm.settings.notifications?.error || ''}
            onChange={(e) =>
              updateFormSettings({
                notifications: {
                  ...currentForm.settings.notifications,
                  error: e.target.value,
                },
              })
            }
            rows={2}
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-4"
          />
        </div>
      </section>
    </div>
  );
};