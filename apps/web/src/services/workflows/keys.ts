
export const workflowsQueryKeys = {
    all: ["workflows"] as const,
    list: (workspaceId: string, formId: string) =>
      [...workflowsQueryKeys.all, "list", workspaceId, formId] as const,
    byId: (workspaceId: string, workflowId: string) =>
      [...workflowsQueryKeys.all, "detail", workspaceId, workflowId] as const,
  };