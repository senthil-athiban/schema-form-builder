import { useQuery } from "@tanstack/react-query";
import { integrationsApi } from "@/shared/api/integrations.api";
import type { IntegrationConnectionItem } from "@/shared/api/types";

export const integrationsQueryKeys = {
  all: ["integrations"] as const,
  list: (workspaceId: string) =>
    [...integrationsQueryKeys.all, "list", workspaceId] as const,
};

export async function fetchIntegrationsList(
  workspaceId: string,
): Promise<IntegrationConnectionItem[]> {
  const { data } = await integrationsApi.list(workspaceId);
  return data;
}

export function useIntegrationsListQuery(workspaceId: string) {
  return useQuery({
    queryKey: integrationsQueryKeys.list(workspaceId),
    queryFn: () => fetchIntegrationsList(workspaceId),
    refetchOnWindowFocus: true,
  });
}