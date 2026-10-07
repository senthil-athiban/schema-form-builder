import { useQuery } from "@tanstack/react-query";
import { workflowsApi } from "@/shared/api/workflows.api";
import type { WorkflowListItem, WorkflowRecord } from "@/shared/api/types";
import { workflowsQueryKeys } from "./keys";

export async function fetchWorkflowsList(
  workspaceId: string,
  formId: string,
): Promise<WorkflowListItem[]> {
  const { data } = await workflowsApi.list(formId, workspaceId);
  return data;
}

export async function fetchWorkflowById(
  workspaceId: string,
  workflowId: string,
): Promise<WorkflowRecord> {
  const { data } = await workflowsApi.getById(workflowId, workspaceId);
  return data;
}

export function useWorkflowsListQuery(workspaceId: string, formId: string | undefined) {
  return useQuery({
    queryKey: workflowsQueryKeys.list(workspaceId, formId ?? ""),
    queryFn: () => fetchWorkflowsList(workspaceId, formId!),
    enabled: Boolean(formId),
  });
}

export function useWorkflowByIdQuery(workspaceId: string, workflowId: string | undefined) {
  return useQuery({
    queryKey: workflowsQueryKeys.byId(workspaceId, workflowId ?? ""),
    queryFn: () => fetchWorkflowById(workspaceId, workflowId!),
    enabled: Boolean(workflowId),
    refetchOnWindowFocus: false, // don't overwrite unsaved canvas edits
  });
}
