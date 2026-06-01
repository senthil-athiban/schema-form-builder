import { useQuery } from "@tanstack/react-query";
import { publicFormsApi } from "@/shared/api/public-forms.api";
import type { PublicFormResult } from "@/shared/api/types";

export const publicFormsQueryKeys = {
  all: ["public-forms"] as const,
  byToken: (token: string) =>
    [...publicFormsQueryKeys.all, "by-token", token] as const,
};

export async function fetchPublicFormByToken(
  token: string,
): Promise<PublicFormResult> {
  const { data } = await publicFormsApi.getByToken(token);
  return data;
}

export function usePublicFormByTokenQuery(token: string | undefined) {
  return useQuery({
    queryKey: publicFormsQueryKeys.byToken(token ?? ""),
    queryFn: () => fetchPublicFormByToken(token ?? ""),
    enabled: Boolean(token),
  });
}
