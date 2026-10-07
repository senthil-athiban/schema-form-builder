import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workflowsApi } from "@/shared/api/workflows.api";
import type {
  CreateWorkflowPayload,
  SaveWorkflowPayload,
  WorkflowRecord,
} from "@/shared/api/types";
import { workflowsQueryKeys } from "./keys";

export function useCreateWorkflowMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateWorkflowPayload): Promise<WorkflowRecord> => {
      const { data } = await workflowsApi.create(payload, workspaceId);
      return data;
    },
    onSuccess: (workflow, vars) => {
      queryClient.setQueryData(workflowsQueryKeys.byId(workspaceId, workflow.id), workflow);
      void queryClient.invalidateQueries({
        queryKey: workflowsQueryKeys.list(workspaceId, vars.formId),
      });
    },
  });
}

export function useSaveWorkflowMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workflowId,
      payload,
    }: {
      workflowId: string;
      payload: SaveWorkflowPayload;
    }): Promise<WorkflowRecord> => {
      const { data } = await workflowsApi.save(workflowId, payload, workspaceId);
      return data;
    },
    onSuccess: (workflow) => {
      // Server response is the source of truth (normalized config, default actions)
      queryClient.setQueryData(workflowsQueryKeys.byId(workspaceId, workflow.id), workflow);
      void queryClient.invalidateQueries({
        queryKey: workflowsQueryKeys.list(workspaceId, workflow.triggerConfig.formId),
      });
    },
  });
}

export function useDeleteWorkflowMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workflowId }: { workflowId: string; formId: string }) => {
      await workflowsApi.remove(workflowId, workspaceId);
    },
    onSuccess: (_data, vars) => {
      queryClient.removeQueries({ queryKey: workflowsQueryKeys.byId(workspaceId, vars.workflowId) });
      void queryClient.invalidateQueries({
        queryKey: workflowsQueryKeys.list(workspaceId, vars.formId),
      });
    },
  });
}
