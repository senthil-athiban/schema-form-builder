import type { FormListItem } from "@/shared/api/types";

export type FormState = "published" | "draft" | "closed" | "archived";

export function getFormState(form: FormListItem): FormState {
  if (form.status === "PUBLISHED") return "published";
  if (form.status === "ARCHIVED") return "archived";
  return form.publicToken ? "closed" : "draft";
}

export const FORM_STATE_STYLES: Record<FormState, { label: string; badge: string; dot: string }> = {
  published: { label: "Published", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  draft: { label: "Draft", badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  closed: { label: "Closed", badge: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400" },
  archived: { label: "Archived", badge: "bg-slate-100 text-slate-500 ring-slate-200", dot: "bg-slate-300" },
};

export type StatusFilter = "all" | FormState;

export const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
];

export type SortKey = "updated-desc" | "updated-asc" | "name-asc" | "submissions-desc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "updated-desc", label: "Last updated" },
  { value: "updated-asc", label: "Oldest updated" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "submissions-desc", label: "Most submissions" },
];

const COMPARATORS: Record<SortKey, (a: FormListItem, b: FormListItem) => number> = {
  "updated-desc": (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  "updated-asc": (a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt),
  "name-asc": (a, b) => a.name.localeCompare(b.name),
  "submissions-desc": (a, b) => b._count.submissions - a._count.submissions,
};

export function filterAndSortForms(
  forms: FormListItem[],
  { search, status, sort }: { search: string; status: StatusFilter; sort: SortKey },
): FormListItem[] {
  const query = search.trim().toLowerCase();
  return forms
    .filter((form) => status === "all" || getFormState(form) === status)
    .filter(
      (form) =>
        !query ||
        form.name.toLowerCase().includes(query) ||
        (form.description ?? "").toLowerCase().includes(query),
    )
    .sort(COMPARATORS[sort]);
}

const ICON_COLORS = [
  "bg-indigo-50 text-indigo-600",
  "bg-amber-50 text-amber-600",
  "bg-violet-50 text-violet-600",
  "bg-rose-50 text-rose-600",
  "bg-sky-50 text-sky-600",
  "bg-emerald-50 text-emerald-600",
];

export function getIconColor(formId: string): string {
  let hash = 0;
  for (const char of formId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return ICON_COLORS[hash % ICON_COLORS.length] ?? ICON_COLORS[0];
}

export const formatUpdatedAt = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const getDisplayVersion = (form: FormListItem) =>
  form.status === "PUBLISHED" && form.publishedVersion ? form.publishedVersion : form.latestVersion;

export const actionButtonClass =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60";
