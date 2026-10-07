
export const integrationsQueryKeys = {
    all: ["integrations"] as const,
    list: (workspaceId: string) =>
      [...integrationsQueryKeys.all, "list", workspaceId] as const,
    slackChannels: (workspaceId: string, connectionId: string) =>
      [...integrationsQueryKeys.all, "slack-channels", workspaceId, connectionId] as const,
  };
  