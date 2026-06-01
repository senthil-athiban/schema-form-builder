import { useMemo } from "react";
import {
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Table2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getPublicFormUrl, getWorkspaceId } from "@/shared/api";
import type { FormListItem, FormStatus } from "@/shared/api/types";
import { useFormsListQuery } from "@/services/forms/queries";
import { usePublishFormMutation } from "@/services/forms/mutations";

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
  const workspaceId = useMemo(() => getWorkspaceId(), []);
  const formsQuery = useFormsListQuery(workspaceId);
  const publishMutation = usePublishFormMutation();
  const forms: FormListItem[] = formsQuery.data ?? [];
  const isLoading = formsQuery.isLoading;
  const error = formsQuery.error instanceof Error
    ? formsQuery.error.message
    : formsQuery.error
      ? "Failed to load forms"
      : null;
  const publishingId = publishMutation.isPending
    ? publishMutation.variables ?? null
    : null;

  const handlePublish = async (formId: string, formName: string) => {
    if (
      !window.confirm(
        `Publish "${formName}"? A public link will be created for customers.`,
      )
    ) {
      return;
    }

    try {
      const data = await publishMutation.mutateAsync(formId);
      const publicUrl = getPublicFormUrl(data.publicToken);
      window.prompt("Form published! Copy the public link:", publicUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to publish form";
      alert(message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your forms</h1>
            <p className="mt-1 text-sm text-slate-500">
              Select a form to edit, publish, or share with customers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void formsQuery.refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : undefined}
              />
              Refresh
            </button>
            <Link to="/forms/new">
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
            <Link to="/forms/new">
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
              const isPublishing = publishingId === form.id;
              const publicUrl = form.publicToken
                ? getPublicFormUrl(form.publicToken)
                : null;

              return (
                <li
                  key={form.id}
                  className="flex items-center gap-2 px-2 py-1 sm:gap-4 sm:px-3"
                >
                  <Link
                    to={`/forms/${form.id}`}
                    className="flex min-w-0 flex-1 items-center gap-4 rounded-lg px-2 py-3 transition hover:bg-slate-50"
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
                          v
                          {form.status === "PUBLISHED" && form.publishedVersion
                            ? form.publishedVersion
                            : form.latestVersion}
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
                  </Link>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <Link
                      to={`/forms/${form.id}/submissions`}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:text-sm"
                    >
                      <Table2 size={14} />
                      View submissions
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handlePublish(form.id, form.name)}
                      disabled={isPublishing || publishMutation.isPending}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60 sm:text-sm"
                    >
                      {isPublishing ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      {form.status === "PUBLISHED" ? "Re-publish" : "Publish"}
                    </button>

                    {publicUrl ? (
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:text-sm"
                      >
                        <ExternalLink size={14} />
                        View live
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};
