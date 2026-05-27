import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Table2,
  Type,
} from "lucide-react";
import { useFormByIdQuery } from "@/services/forms/queries";
import { useFormSubmissionsListQuery } from "@/services/submissions/queries";
import { flattenQuestions } from "@/form-engine/utils/helpers";
import type { FormQuestion, FormSchema } from "@/shared/types";

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isAnswerEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function optionLabel(question: FormQuestion, value: unknown): string {
  const opts = question.config?.options ?? [];
  const str = String(value);
  const opt = opts.find((o) => String(o.value) === str);
  return opt?.label ?? str;
}

function formatValueAsString(question: FormQuestion, value: unknown): string {
  if (isAnswerEmpty(value)) return "";

  switch (question.type) {
    case "select":
    case "radio":
      return optionLabel(question, value);
    case "multiselect":
      if (Array.isArray(value)) {
        return value
          .map((v) => optionLabel(question, v))
          .filter(Boolean)
          .join(", ");
      }
      return String(value);
    case "date":
    case "time":
      return String(value);
    case "number":
    case "rating":
    case "slider":
      return typeof value === "number" ? String(value) : String(value);
    case "file":
      if (typeof value === "object" && value !== null) {
        try {
          return JSON.stringify(value);
        } catch {
          return "…";
        }
      }
      return String(value);
    default:
      if (typeof value === "object") {
        try {
          return JSON.stringify(value);
        } catch {
          return "…";
        }
      }
      return String(value);
  }
}

function QuestionHeaderIcon({ question }: { question: FormQuestion }) {
  const iconClass = "shrink-0 text-slate-400";
  switch (question.type) {
    case "checkbox":
      return <CheckSquare size={14} className={iconClass} aria-hidden />;
    case "date":
    case "time":
      return <Calendar size={14} className={iconClass} aria-hidden />;
    case "number":
    case "rating":
    case "slider":
      return <span className="font-mono text-xs text-slate-400" aria-hidden>
        #
      </span>;
    default:
      return <Type size={14} className={iconClass} aria-hidden />;
  }
}

function SubmissionAnswerCell({
  question,
  value,
}: {
  question: FormQuestion;
  value: unknown;
}) {
  if (isAnswerEmpty(value)) {
    return <span className="text-slate-400">—</span>;
  }

  if (question.type === "checkbox") {
    const checked = value === true || value === "true" || value === 1 || value === "1";
    return (
      <span className="inline-flex items-center justify-center py-0.5">
        <input
          type="checkbox"
          readOnly
          checked={checked}
          tabIndex={-1}
          className="h-4 w-4 cursor-default rounded border-slate-300 text-indigo-600 accent-indigo-600"
          aria-label={checked ? "Yes" : "No"}
        />
      </span>
    );
  }

  const text = formatValueAsString(question, value);
  return (
    <span className="text-slate-800" title={text.length > 80 ? text : undefined}>
      {text}
    </span>
  );
}

function columnsFromSchema(schema: FormSchema): FormQuestion[] {
  return flattenQuestions(schema).filter(
    (q) => q.type !== "section" && q.type !== "html",
  );
}

const PAGE_SIZE = 25;

export const FormSubmissionsPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [offset, setOffset] = useState(0);

  const formQuery = useFormByIdQuery(formId);
  const submissionsQuery = useFormSubmissionsListQuery(formId, {
    limit: PAGE_SIZE,
    offset,
  });

  const schema = formQuery.data?.schema;
  const formName = formQuery.data?.form.name ?? "Form";
  const rows = submissionsQuery.data?.rows ?? [];
  const meta = submissionsQuery.data?.meta;
  const total = meta?.total ?? 0;
  const canPrev = offset > 0;
  const canNext = meta !== undefined && offset + meta.limit < total;

  const dataQuestions = useMemo(
    () => (schema ? columnsFromSchema(schema) : []),
    [schema],
  );
  console.log('dataQuestions:', dataQuestions)

  const errorMessage = useMemo(() => {
    if (formQuery.error instanceof Error) return formQuery.error.message;
    if (submissionsQuery.error instanceof Error) {
      return submissionsQuery.error.message;
    }
    if (formQuery.error || submissionsQuery.error) return "Failed to load data";
    return null;
  }, [formQuery.error, submissionsQuery.error]);

  const isLoading =
    (formQuery.isLoading && !formQuery.data) ||
    (submissionsQuery.isLoading && !submissionsQuery.data);

  if (!formId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <p className="text-red-600">Missing form id</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Link
              to="/forms"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              aria-label="Back to forms"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Submissions</h1>
              <p className="mt-1 text-sm text-slate-500">
                <Link
                  to={`/forms/${formId}`}
                  className="font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {formName}
                </Link>
                {" · "}
                {total} total
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[min(100%,120rem)] flex-1 px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 size={22} className="animate-spin" />
            Loading submissions…
          </div>
        ) : errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <Table2 size={40} className="text-slate-300" />
            <p className="mt-4 text-lg font-medium text-slate-800">No submissions yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Responses from the public link or test submissions will appear here.
            </p>
            <Link
              to={`/forms/${formId}`}
              className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Back to editor
            </Link>
          </div>
        ) : !schema ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Form schema is not available; reload the page or open the editor once to sync.
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-3 text-center font-medium text-slate-500">
                        #
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={14} className="shrink-0 text-slate-400" aria-hidden />
                          Submitted
                        </span>
                      </th>
                      {dataQuestions.map((q) => (
                        <th
                          key={q.id}
                          className="min-w-40 max-w-[20rem] px-4 py-3 font-medium text-slate-700"
                          title={q.label}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <QuestionHeaderIcon question={q} />
                            <span className="line-clamp-2 normal-case">{q.label}</span>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, index) => (
                      <tr key={row.id} className="hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-3 py-3 text-center text-slate-500">
                          {offset + index + 1}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-800">
                          {formatDate(row.submittedAt)}
                        </td>
                        {dataQuestions.map((q) => (
                          <td key={q.id} className="max-w-[20rem] px-4 py-3 align-top">
                            <div className="line-clamp-4 wrap-break-word">
                              <SubmissionAnswerCell
                                question={q}
                                value={row.responseData[q.id]}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {meta && total > meta.limit ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                <span>
                  Showing {offset + 1}–{Math.min(offset + rows.length, total)} of {total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!canPrev || submissionsQuery.isFetching}
                    onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={!canNext || submissionsQuery.isFetching}
                    onClick={() => setOffset((o) => o + PAGE_SIZE)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
};
