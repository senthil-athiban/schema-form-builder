import { Link } from "react-router-dom";
import { ArrowRight, ChevronsUpDown, FileText } from "lucide-react";
import type { FormListItem } from "@/shared/api/types";
import { FormActions, type FormActionHandlers } from "./form-actions";
import { FormStatusBadge } from "./form-status-badge";
import { formatUpdatedAt, getDisplayVersion, getIconColor, type SortKey } from "./forms-list.utils";

interface FormsTableProps extends FormActionHandlers {
  forms: FormListItem[];
  sort: SortKey;
  onToggleUpdatedSort: () => void;
}

export const FormsTable: React.FC<FormsTableProps> = ({ forms, sort, onToggleUpdatedSort, ...actions }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead className="border-y border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
        <tr>
          <th className="w-16 py-3 pl-5 pr-2">
            <span className="sr-only">Icon</span>
          </th>
          <th className="px-3 py-3">Form</th>
          <th className="px-3 py-3">Status</th>
          <th className="hidden px-3 py-3 md:table-cell">Submissions</th>
          <th className="hidden px-3 py-3 lg:table-cell">
            <button
              type="button"
              onClick={onToggleUpdatedSort}
              className={`inline-flex items-center gap-1 hover:text-slate-700 ${
                sort.startsWith("updated") ? "text-slate-700" : ""
              }`}
            >
              Last updated
              <ChevronsUpDown size={13} />
            </button>
          </th>
          <th className="py-3 pl-3 pr-5 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {forms.map((form) => (
          <tr key={form.id} className="transition hover:bg-slate-50/60">
            <td className="py-4 pl-5 pr-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getIconColor(form.id)}`}>
                <FileText size={18} />
              </div>
            </td>
            <td className="max-w-xs px-3 py-4">
              <div className="flex items-center gap-2">
                <Link to={`/forms/${form.id}`} className="truncate font-semibold text-slate-900 hover:text-indigo-600">
                  {form.name}
                </Link>
                <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                  v{getDisplayVersion(form)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-slate-500">{form.description || "No description added"}</p>
            </td>
            <td className="px-3 py-4">
              <FormStatusBadge form={form} />
            </td>
            <td className="hidden px-3 py-4 md:table-cell">
              <p className="font-semibold text-slate-900">{form._count.submissions}</p>
              <Link
                to={`/forms/${form.id}/submissions`}
                className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
              >
                View submissions
                <ArrowRight size={13} />
              </Link>
            </td>
            <td className="hidden whitespace-nowrap px-3 py-4 text-slate-700 lg:table-cell">
              {formatUpdatedAt(form.updatedAt)}
            </td>
            <td className="py-4 pl-3 pr-5">
              <FormActions form={form} {...actions} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
