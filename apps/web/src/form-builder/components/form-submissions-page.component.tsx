import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  ChartColumn,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Search,
  Table2,
} from "lucide-react";
import { getAnswerQuestions } from "@form-builder/shared/form-validation";
import { getPublicFormUrl } from "@/shared/api";
import type { SubmissionFilters, SubmissionListItem } from "@/shared/api/types";
import { useFormByIdQuery } from "@/services/forms/queries";
import { useFormSubmissionsListQuery, useSubmissionStatsQuery } from "@/services/submissions/queries";
import { StatCard } from "./forms-list/stat-card";
import { SubmissionsTable } from "./submissions/submissions-table";
import { SubmissionDetailSheet } from "./submissions/submission-detail-sheet";
import { ExportMenu } from "./submissions/export-menu";
import { Pagination } from "./submissions/pagination";
import {
  DATE_RANGE_OPTIONS,
  formatRelativeTime,
  getDateRangeStart,
  type DateRange,
} from "./submissions/submissions.utils";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const SEARCH_DEBOUNCE_MS = 300;

const selectClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-indigo-400 focus:outline-none";

export const FormSubmissionsPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  // The range's start is fixed when picked, so the query key doesn't change on every render
  const [dateRange, setDateRange] = useState<{ range: DateRange; from?: string }>({ range: "all" });
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0] ?? 10);
  const [selected, setSelected] = useState<{ row: SubmissionListItem; number: number } | null>(null);

  // Search runs on the server, so wait until typing pauses
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters: SubmissionFilters = useMemo(
    () => ({
      ...(search && { search }),
      ...(dateRange.from && { from: dateRange.from }),
      sort,
    }),
    [search, dateRange.from, sort],
  );

  const formQuery = useFormByIdQuery(formId);
  const statsQuery = useSubmissionStatsQuery(formId);
  const submissionsQuery = useFormSubmissionsListQuery(formId, {
    ...filters,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const form = formQuery.data?.form;
  const schema = formQuery.data?.schema;
  const questions = useMemo(() => (schema ? getAnswerQuestions(schema) : []), [schema]);
  const stats = statsQuery.data;

  const rows = submissionsQuery.data?.rows ?? [];
  const matchingTotal = submissionsQuery.data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(matchingTotal / pageSize));
  const isFiltered = Boolean(search || dateRange.from);
  const publicUrl = form?.status === "PUBLISHED" && form.publicToken ? getPublicFormUrl(form.publicToken) : null;

  const errorMessage =
    formQuery.error instanceof Error
      ? formQuery.error.message
      : submissionsQuery.error instanceof Error
        ? submissionsQuery.error.message
        : formQuery.error || submissionsQuery.error
          ? "Failed to load submissions"
          : null;

  const isInitialLoading = (formQuery.isLoading && !formQuery.data) || (submissionsQuery.isLoading && !submissionsQuery.data);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setDateRange({ range: "all" });
    setPage(1);
  };

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
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link
              to="/forms"
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              aria-label="Back to forms"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Submissions</h1>
              <p className="mt-1 text-sm text-slate-500">
                <Link to={`/forms/${formId}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                  {form?.name ?? "Form"}
                </Link>
                {stats && (
                  <>
                    {" · "}
                    {stats.total} total submission{stats.total === 1 ? "" : "s"}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {publicUrl ? (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ExternalLink size={16} />
                View form
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Publish the form to view it"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-400"
              >
                <ExternalLink size={16} />
                View form
              </button>
            )}
            <ExportMenu
              formId={formId}
              formName={form?.name ?? "form"}
              filters={filters}
              disabled={matchingTotal === 0}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-6 py-8">
        {isInitialLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 size={22} className="animate-spin" />
            Loading submissions…
          </div>
        ) : errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        ) : !schema ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Form schema is not available; reload the page or open the editor once to sync.
          </div>
        ) : stats?.total === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <Table2 size={40} className="text-slate-300" />
            <p className="mt-4 text-lg font-medium text-slate-800">No submissions yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Responses from the public link will appear here.
            </p>
            <Link to={`/forms/${formId}`} className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Back to editor
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-stretch gap-4">
              <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={FileText} iconClass="bg-blue-50 text-blue-600" value={stats?.total ?? "–"} label="Total submissions" />
                <StatCard icon={CalendarDays} iconClass="bg-emerald-50 text-emerald-600" value={stats?.today ?? "–"} label="Today" />
                <StatCard icon={ChartColumn} iconClass="bg-violet-50 text-violet-600" value={stats?.last7Days ?? "–"} label="Last 7 days" />
                <StatCard
                  icon={Clock}
                  iconClass="bg-slate-100 text-slate-600"
                  value={stats?.lastSubmittedAt ? formatRelativeTime(stats.lastSubmittedAt) : "–"}
                  label="Last response"
                />
              </div>

              <div className="relative self-start">
                <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={dateRange.range}
                  onChange={(e) => {
                    const range = e.target.value as DateRange;
                    setDateRange({ range, from: getDateRangeStart(range) });
                    setPage(1);
                  }}
                  className={`${selectClass} pl-9`}
                  aria-label="Date range"
                >
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-3 p-5">
                <div className="relative min-w-60 flex-1 sm:max-w-md">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search answers…"
                    className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                {submissionsQuery.isFetching && <Loader2 size={16} className="animate-spin text-slate-400" />}
              </div>

              {rows.length === 0 ? (
                <div className="border-t border-slate-200 py-14 text-center">
                  <p className="font-medium text-slate-800">No submissions match your filters</p>
                  {isFiltered && (
                    <button type="button" onClick={clearFilters} className="mt-2 text-sm text-indigo-600 hover:underline">
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <SubmissionsTable
                  rows={rows}
                  offset={(page - 1) * pageSize}
                  questions={questions}
                  sort={sort}
                  onToggleSort={() => {
                    setSort((s) => (s === "desc" ? "asc" : "desc"));
                    setPage(1);
                  }}
                  onOpen={(row, number) => setSelected({ row, number })}
                />
              )}

              {matchingTotal > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
                  <p>
                    Showing {rows.length} of {matchingTotal} submission{matchingTotal === 1 ? "" : "s"}
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      Rows per page
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(1);
                        }}
                        className={selectClass}
                      >
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Pagination
                      page={Math.min(page, totalPages)}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      disabled={submissionsQuery.isFetching}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <SubmissionDetailSheet
        submission={selected?.row ?? null}
        number={selected?.number ?? null}
        questions={questions}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};
