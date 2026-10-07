import { useQuery } from "@tanstack/react-query";
import { integrationsApi } from "@/shared/api/integrations.api";
import type { IntegrationConnectionItem, SlackChannel } from "@/shared/api/types";
import { integrationsQueryKeys } from "./keys";

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

export async function fetchSlackChannels(
  workspaceId: string,
  connectionId: string,
): Promise<SlackChannel[]> {
  const { data } = await integrationsApi.listSlackChannels(connectionId, workspaceId);
  return data;
}

export function useSlackChannelsQuery(workspaceId: string, connectionId: string | undefined) {
  return useQuery({
    queryKey: integrationsQueryKeys.slackChannels(workspaceId, connectionId ?? ""),
    queryFn: () => fetchSlackChannels(workspaceId, connectionId!),
    enabled: Boolean(connectionId),
    staleTime: 60_000,
    retry: false, // Slack errors like missing_scope won't fix themselves
  });
}
