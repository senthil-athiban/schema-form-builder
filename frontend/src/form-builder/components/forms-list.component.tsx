import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Plus, RefreshCw } from "lucide-react";
import { ApiError, formsApi, getWorkspaceId } from "@/shared/api";
import type { FormListItem, FormStatus } from "@/shared/api/types";
import { Link } from "react-router-dom";

const statusStyles: Record<FormStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700 ring-amber-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ARCHIVED: "bg-slate-100 text-slate-600 ring-slate-200",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export const FormsList: React.FC = () => {
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await formsApi.list(getWorkspaceId());
      setForms(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load forms";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchForms();
  }, [fetchForms]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your forms</h1>
            <p className="mt-1 text-sm text-slate-500">
              Select a form to edit or create a new one.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchForms()}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : undefined}
              />
              Refresh
            </button>
            <Link to={'/forms/new'}>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <Plus size={16} />
              Create form
            </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {isLoading && forms.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading forms…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <FileText size={40} className="text-slate-300" />
            <p className="mt-4 text-lg font-medium text-slate-800">
              No forms yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first form to get started.
            </p>
            <Link to={'/forms/new'}>
            <button
              type="button"
              className="mt-6 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus size={16} />
              Create form
            </button>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {forms.map((form) => {
              return (
                <li key={form.id}>
                  <Link to={`/forms/${form.id}`}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-slate-900">
                          {form.name}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[form.status]}`}
                        >
                          {form.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          v{form.latestVersion}
                        </span>
                      </div>
                      {form.description ? (
                        <p className="mt-0.5 truncate text-sm text-slate-500">
                          {form.description}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-400">
                        Updated {formatDate(form.updatedAt)} ·{" "}
                        {form._count.submissions} submission
                        {form._count.submissions === 1 ? "" : "s"}
                      </p>
                    </div>
                  </button>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};
