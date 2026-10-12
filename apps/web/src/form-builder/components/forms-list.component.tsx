import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpDown,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { getPublicFormUrl, getWorkspaceId } from "@/shared/api";
import type { FormListItem } from "@/shared/api/types";
import { useFormsListQuery } from "@/services/forms/queries";
import { usePublishFormMutation, useUnpublishFormMutation } from "@/services/forms/mutations";
import { copyToClipboard } from "@/shared/lib/clipboard";
import { UserMenu } from "@/auth/user-menu";
import { SlackConnect } from "./slack-connect.component";
import { StatCard } from "./forms-list/stat-card";
import { FormsTable } from "./forms-list/forms-table";
import { FormsGrid } from "./forms-list/forms-grid";
import {
  filterAndSortForms,
  getFormState,
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
  type SortKey,
  type StatusFilter,
} from "./forms-list/forms-list.utils";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const selectClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-indigo-400 focus:outline-none";

export const FormsList: React.FC = () => {
  const workspaceId = useMemo(() => getWorkspaceId(), []);
  const formsQuery = useFormsListQuery(workspaceId);
  const publishMutation = usePublishFormMutation();
  const unpublishMutation = useUnpublishFormMutation();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("updated-desc");
  const [view, setView] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0] ?? 10);

  const forms = useMemo<FormListItem[]>(() => formsQuery.data ?? [], [formsQuery.data]);
  const isLoading = formsQuery.isLoading;
  const isRefreshing = formsQuery.isFetching;
  const error =
    formsQuery.error instanceof Error ? formsQuery.error.message : formsQuery.error ? "Failed to load forms" : null;

  const stats = useMemo(
    () => ({
      total: forms.length,
      published: forms.filter((f) => getFormState(f) === "published").length,
      drafts: forms.filter((f) => getFormState(f) === "draft").length,
      submissions: forms.reduce((sum, f) => sum + f._count.submissions, 0),
    }),
    [forms],
  );

  const filtered = useMemo(() => filterAndSortForms(forms, { search, status, sort }), [forms, search, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const busyFormId = publishMutation.isPending
    ? (publishMutation.variables ?? null)
    : unpublishMutation.isPending
      ? (unpublishMutation.variables ?? null)
      : null;

  const updateFilters = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const toggleStatusCard = (target: StatusFilter) =>
    updateFilters(() => setStatus((current) => (current === target ? "all" : target)));

  const clearFilters = () =>
    updateFilters(() => {
      setSearch("");
      setStatus("all");
    });

  const handlePublish = async (form: FormListItem) => {
    const message =
      form.status === "PUBLISHED"
        ? `Re-publish "${form.name}"? Respondents will see the latest saved version.`
        : `Publish "${form.name}"? A public link will be created for customers.`;
    if (!window.confirm(message)) return;

    try {
      const data = await publishMutation.mutateAsync(form.id);
      const publicUrl = getPublicFormUrl(data.publicToken);
      if (await copyToClipboard(publicUrl)) {
        alert(`"${form.name}" is live. The public link was copied to your clipboard.`);
      } else {
        window.prompt("Form published! Copy the public link:", publicUrl);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to publish form");
    }
  };

  const handleUnpublish = async (form: FormListItem) => {
    if (
      !window.confirm(
        `Unpublish "${form.name}"? The public link will stop accepting responses. Publishing again reopens the same link.`,
      )
    ) {
      return;
    }
    try {
      await unpublishMutation.mutateAsync(form.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unpublish form");
    }
  };

  const actionHandlers = {
    onPublish: (form: FormListItem) => void handlePublish(form),
    onUnpublish: (form: FormListItem) => void handleUnpublish(form),
    busyFormId,
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your forms</h1>
            <p className="mt-1 text-sm text-slate-500">Select a form to edit, publish, or share with customers.</p>
          </div>
          <div className="flex items-center gap-2">
            <SlackConnect />
            <button
              type="button"
              onClick={() => void formsQuery.refetch()}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : undefined} />
              Refresh
            </button>
            <Link
              to="/forms/new"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <Plus size={16} />
              Create form
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-6 py-8">
        {isLoading && forms.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading forms…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <FileText size={40} className="text-slate-300" />
            <p className="mt-4 text-lg font-medium text-slate-800">No forms yet</p>
            <p className="mt-1 text-sm text-slate-500">Create your first form to get started.</p>
            <Link
              to="/forms/new"
              className="mt-6 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus size={16} />
              Create form
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={FileText} iconClass="bg-blue-50 text-blue-600" value={stats.total} label="Total forms" />
              <StatCard
                icon={CircleCheck}
                iconClass="bg-emerald-50 text-emerald-600"
                value={stats.published}
                label="Published"
                active={status === "published"}
                onClick={() => toggleStatusCard("published")}
              />
              <StatCard
                icon={FileText}
                iconClass="bg-amber-50 text-amber-600"
                value={stats.drafts}
                label="Drafts"
                active={status === "draft"}
                onClick={() => toggleStatusCard("draft")}
              />
              <StatCard
                icon={ChartColumn}
                iconClass="bg-violet-50 text-violet-600"
                value={stats.submissions}
                label="Total submissions"
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-3 p-5">
                <div className="relative min-w-60 flex-1 sm:max-w-md">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => updateFilters(() => setSearch(e.target.value))}
                    placeholder="Search forms by name or description…"
                    className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <select
                    value={status}
                    onChange={(e) => updateFilters(() => setStatus(e.target.value as StatusFilter))}
                    className={selectClass}
                    aria-label="Filter by status"
                  >
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <div className="relative">
                    <ArrowUpDown
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <select
                      value={sort}
                      onChange={(e) => updateFilters(() => setSort(e.target.value as SortKey))}
                      className={`${selectClass} pl-9`}
                      aria-label="Sort forms"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex overflow-hidden rounded-lg border border-slate-200">
                    {(
                      [
                        { value: "list", icon: List, label: "List view" },
                        { value: "grid", icon: LayoutGrid, label: "Grid view" },
                      ] as const
                    ).map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setView(value)}
                        aria-label={label}
                        aria-pressed={view === value}
                        className={`flex h-10 w-10 items-center justify-center transition ${
                          view === value ? "bg-indigo-50 text-indigo-600" : "bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <Icon size={17} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="border-t border-slate-200 py-14 text-center">
                  <p className="font-medium text-slate-800">No forms match your filters</p>
                  <button type="button" onClick={clearFilters} className="mt-2 text-sm text-indigo-600 hover:underline">
                    Clear filters
                  </button>
                </div>
              ) : view === "list" ? (
                <FormsTable
                  forms={pageItems}
                  sort={sort}
                  onToggleUpdatedSort={() =>
                    updateFilters(() => setSort((s) => (s === "updated-desc" ? "updated-asc" : "updated-desc")))
                  }
                  {...actionHandlers}
                />
              ) : (
                <div className="border-t border-slate-200">
                  <FormsGrid forms={pageItems} {...actionHandlers} />
                </div>
              )}

              {filtered.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
                  <p>
                    Showing {pageItems.length} of {filtered.length} form{filtered.length === 1 ? "" : "s"}
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      Rows per page
                      <select
                        value={pageSize}
                        onChange={(e) => updateFilters(() => setPageSize(Number(e.target.value)))}
                        className={selectClass}
                      >
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setPage(n)}
                          aria-current={n === currentPage ? "page" : undefined}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg font-medium ${
                            n === currentPage
                              ? "border border-indigo-200 bg-indigo-50 text-indigo-600"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
