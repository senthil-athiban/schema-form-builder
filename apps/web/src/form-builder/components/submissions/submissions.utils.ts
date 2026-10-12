export type DateRange = "all" | "today" | "7d" | "30d" | "90d";

export const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function getDateRangeStart(range: DateRange): string | undefined {
  if (range === "all") return undefined;
  if (range === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }
  const days = { "7d": 7, "30d": 30, "90d": 90 }[range];
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatDateAnswer = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(value: string): string {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return "just now";
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 86400 * 30) return relative.format(Math.round(seconds / 86400), "day");
  if (abs < 86400 * 365) return relative.format(Math.round(seconds / (86400 * 30)), "month");
  return relative.format(Math.round(seconds / (86400 * 365)), "year");
}

export function formatRelativeDay(value: string): string {
  const answer = new Date(value);
  const now = new Date();
  const answerDay = Date.UTC(answer.getUTCFullYear(), answer.getUTCMonth(), answer.getUTCDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return relative.format(Math.round((answerDay - today) / DAY_MS), "day");
}

export function getPageNumbers(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, i) => {
    const previous = sorted[i - 1];
    return previous !== undefined && page - previous > 1 ? ["gap" as const, page] : [page];
  });
}

export const toFileName = (formName: string, extension: string) => {
  const base = formName.trim().replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "form";
  return `${base}-submissions.${extension}`;
};
