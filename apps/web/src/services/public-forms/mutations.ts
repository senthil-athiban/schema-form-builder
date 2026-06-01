import { useMutation } from "@tanstack/react-query";
import { publicFormsApi } from "@/shared/api/public-forms.api";
import type { SubmissionRecord } from "@/shared/api/types";

export function useSubmitPublicFormMutation() {
  return useMutation({
    mutationFn: async ({
      token,
      responseData,
    }: {
      token: string;
      responseData: Record<string, unknown>;
    }): Promise<SubmissionRecord> => {
      const { data } = await publicFormsApi.submit(token, { responseData });
      return data;
    },
  });
}
