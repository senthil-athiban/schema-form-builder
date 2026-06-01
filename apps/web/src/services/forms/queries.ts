import { useQuery } from "@tanstack/react-query";
import { formsApi } from "@/shared/api/forms.api";
import type { FormListItem, GetFormResult } from "@/shared/api/types";

export const formsQueryKeys = {
  all: ["forms"] as const,
  list: (workspaceId: string) => [...formsQueryKeys.all, "list", workspaceId] as const,
  byId: (formId: string) => [...formsQueryKeys.all, "detail", formId] as const,
};

export async function fetchFormsList(workspaceId: string): Promise<FormListItem[]> {
  const { data } = await formsApi.list(workspaceId);
  return data;
}

export async function fetchFormById(formId: string): Promise<GetFormResult> {
  const { data } = await formsApi.getById(formId);
  return data;
}

export function useFormsListQuery(workspaceId: string) {
  return useQuery({
    queryKey: formsQueryKeys.list(workspaceId),
    queryFn: () => fetchFormsList(workspaceId),
  });
}

export function useFormByIdQuery(formId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: formsQueryKeys.byId(formId ?? ""),
    queryFn: () => fetchFormById(formId ?? ""),
    enabled: Boolean(formId) && enabled,
  });
}
