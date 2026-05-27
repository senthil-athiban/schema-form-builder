import { get, post, put, getWorkspaceId } from "./client";
import type { ApiResponse, ApiResult } from "./types";
import type {
  CreateFormPayload,
  CreateFormResult,
  FormListItem,
  GetFormResult,
} from "./types";

function unwrapData<T>(result: ApiResult<ApiResponse<T>>): ApiResult<T> {
  return { data: result.data.data, status: result.status };
}

export const formsApi = {
  async list(workspaceId?: string) {
    const result = await get<ApiResponse<FormListItem[]>>("/form", {
      params: { workspaceId: workspaceId ?? getWorkspaceId() },
    });
    return unwrapData(result);
  },

  async create(payload: CreateFormPayload) {
    const result = await post<ApiResponse<CreateFormResult>>("/form", payload);
    return unwrapData(result);
  },

  async getById(formId: string) {
    const result = await get<ApiResponse<GetFormResult>>(`/form/${formId}`);
    return unwrapData(result);
  },

  async update(formId: string, payload: CreateFormPayload) {
    const result = await put<ApiResponse<CreateFormResult>>(
      `/form/${formId}`,
      payload,
    );
    return unwrapData(result);
  },
};
