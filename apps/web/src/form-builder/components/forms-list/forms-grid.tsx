import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import type { FormListItem } from "@/shared/api/types";
import { FormActions, type FormActionHandlers } from "./form-actions";
import { FormStatusBadge } from "./form-status-badge";
import { formatUpdatedAt, getDisplayVersion, getIconColor } from "./forms-list.utils";

export const FormsGrid: React.FC<{ forms: FormListItem[] } & FormActionHandlers> = ({ forms, ...actions }) => (
  <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
    {forms.map((form) => (
      <div key={form.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getIconColor(form.id)}`}>
            <FileText size={18} />
          </div>
          <FormStatusBadge form={form} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Link to={`/forms/${form.id}`} className="truncate font-semibold text-slate-900 hover:text-indigo-600">
            {form.name}
          </Link>
          <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
            v{getDisplayVersion(form)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 min-h-10 text-sm text-slate-500">
          {form.description || "No description added"}
        </p>

        <p className="mt-3 text-xs text-slate-400">
          <Link to={`/forms/${form.id}/submissions`} className="text-indigo-600 hover:underline">
            {form._count.submissions} submission{form._count.submissions === 1 ? "" : "s"}
          </Link>
          {" · "}Updated {formatUpdatedAt(form.updatedAt)}
        </p>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <FormActions form={form} {...actions} />
        </div>
      </div>
    ))}
  </div>
);
