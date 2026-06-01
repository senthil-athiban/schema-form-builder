import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formsApi } from "@/shared/api/forms.api";
import type {
  CreateFormPayload,
  CreateFormResult,
  PublishFormResult,
} from "@/shared/api/types";
import { formsQueryKeys } from "./queries";

export function useCreateFormMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateFormPayload): Promise<CreateFormResult> => {
      const { data } = await formsApi.create(payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: formsQueryKeys.all });
    },
  });
}

export function useUpdateFormMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      formId,
      payload,
    }: {
      formId: string;
      payload: CreateFormPayload;
    }): Promise<CreateFormResult> => {
      const { data } = await formsApi.update(formId, payload);
      return data;
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: formsQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: formsQueryKeys.byId(vars.formId),
      });
    },
  });
}

export function usePublishFormMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formId: string): Promise<PublishFormResult> => {
      const { data } = await formsApi.publish(formId);
      return data;
    },
    onSuccess: (_data, formId) => {
      void queryClient.invalidateQueries({ queryKey: formsQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: formsQueryKeys.byId(formId),
      });
    },
  });
}
