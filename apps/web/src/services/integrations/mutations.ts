import { useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationsApi } from "@/shared/api/integrations.api";
import type { CreateConnectSessionResult } from "@/shared/api/types";
import { integrationsQueryKeys } from "./queries";

export function useCreateSlackConnectSessionMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<CreateConnectSessionResult> => {
      const { data } = await integrationsApi.createSession("SLACK", workspaceId);
      return data;
    },
    onSuccess: () => {
      // Webhook may land a few seconds later; refetch when user returns
      void queryClient.invalidateQueries({
        queryKey: integrationsQueryKeys.list(workspaceId),
      });
    },
  });
}