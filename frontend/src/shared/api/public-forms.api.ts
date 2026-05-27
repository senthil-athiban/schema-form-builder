import { get, post } from "./client";
import type {
  ApiResponse,
  ApiResult,
  CreateSubmissionPayload,
  PublicFormResult,
  SubmissionRecord,
} from "./types";

function unwrapData<T>(result: ApiResult<ApiResponse<T>>): ApiResult<T> {
  return { data: result.data.data, status: result.status };
}

export const publicFormsApi = {
  async getByToken(token: string) {
    const result = await get<ApiResponse<PublicFormResult>>(
      `/public/forms/${token}`,
    );
    return unwrapData(result);
  },

  async submit(
    token: string,
    payload: Pick<CreateSubmissionPayload, "responseData" | "metadata">,
  ) {
    const result = await post<ApiResponse<SubmissionRecord>>(
      `/public/forms/${token}/submissions`,
      payload,
    );
    return unwrapData(result);
  },
};
