import { get } from "./client";
import type { ApiResponse, ApiResult, PublicFormResult } from "./types";

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
};
