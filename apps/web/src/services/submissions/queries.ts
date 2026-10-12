import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { submissionsApi, type SubmissionListParams } from "@/shared/api/submissions.api";
import type { ApiListMeta, SubmissionListItem } from "@/shared/api/types";

export const submissionsQueryKeys = {
  all: ["submissions"] as const,
  list: (formId: string, params: SubmissionListParams) =>
    [...submissionsQueryKeys.all, "list", formId, params] as const,
  stats: (formId: string) => [...submissionsQueryKeys.all, "stats", formId] as const,
};

export interface SubmissionsListResult {
  rows: SubmissionListItem[];
  meta: ApiListMeta;
}

export async function fetchSubmissionsList(
  formId: string,
  params?: SubmissionListParams,
): Promise<SubmissionsListResult> {
  const { data } = await submissionsApi.list(formId, params);
  return { rows: data.data, meta: data.meta };
}

export function useFormSubmissionsListQuery(
  formId: string | undefined,
  params: SubmissionListParams = {},
) {
  const resolved = { limit: 50, offset: 0, ...params };

  return useQuery({
    queryKey: submissionsQueryKeys.list(formId ?? "", resolved),
    queryFn: () => fetchSubmissionsList(formId ?? "", resolved),
    enabled: Boolean(formId),
    // Keep the current page on screen while the next page / search loads
    placeholderData: keepPreviousData,
  });
}

export interface SubmissionStats {
  total: number;
  today: number;
  last7Days: number;
  lastSubmittedAt: string | null;
}

export async function fetchSubmissionStats(formId: string): Promise<SubmissionStats> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [all, today, week] = await Promise.all([
    fetchSubmissionsList(formId, { limit: 1 }),
    fetchSubmissionsList(formId, { limit: 1, from: startOfToday.toISOString() }),
    fetchSubmissionsList(formId, { limit: 1, from: sevenDaysAgo.toISOString() }),
  ]);

  return {
    total: all.meta.total,
    today: today.meta.total,
    last7Days: week.meta.total,
    lastSubmittedAt: all.rows[0]?.submittedAt ?? null,
  };
}

export function useSubmissionStatsQuery(formId: string | undefined) {
  return useQuery({
    queryKey: submissionsQueryKeys.stats(formId ?? ""),
    queryFn: () => fetchSubmissionStats(formId ?? ""),
    enabled: Boolean(formId),
  });
}
