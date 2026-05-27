import { useQuery } from "@tanstack/react-query";
import { submissionsApi } from "@/shared/api/submissions.api";
import type { ApiListMeta, SubmissionListItem } from "@/shared/api/types";

export const submissionsQueryKeys = {
  all: ["submissions"] as const,
  list: (formId: string, limit: number, offset: number) =>
    [...submissionsQueryKeys.all, "list", formId, limit, offset] as const,
};

export interface SubmissionsListResult {
  rows: SubmissionListItem[];
  meta: ApiListMeta;
}

export async function fetchSubmissionsList(
  formId: string,
  params?: { limit?: number; offset?: number },
): Promise<SubmissionsListResult> {
  const { data } = await submissionsApi.list(formId, params);
  return { rows: data.data, meta: data.meta };
}

export function useFormSubmissionsListQuery(
  formId: string | undefined,
  options: { limit?: number; offset?: number } = {},
) {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  return useQuery({
    queryKey: submissionsQueryKeys.list(formId ?? "", limit, offset),
    queryFn: () => fetchSubmissionsList(formId ?? "", { limit, offset }),
    enabled: Boolean(formId),
  });
}
