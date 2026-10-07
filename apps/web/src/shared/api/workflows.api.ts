import { del, get, getWorkspaceId, post, put } from "./client";
import type {
  ApiResponse,
  ApiResult,
  CreateWorkflowPayload,
  SaveWorkflowPayload,
  WorkflowListItem,
  WorkflowRecord,
} from "./types";

function unwrapData<T>(result: ApiResult<ApiResponse<T>>): ApiResult<T> {
  return { data: result.data.data, status: result.status };
}

const basePath = (workspaceId?: string) =>
  `/workspaces/${workspaceId ?? getWorkspaceId()}/workflows`;

export const workflowsApi = {
  async list(formId: string, workspaceId?: string) {
    const result = await get<ApiResponse<WorkflowListItem[]>>(basePath(workspaceId), {
      params: { formId },
    });
    return unwrapData(result);
  },

  async getById(workflowId: string, workspaceId?: string) {
    const result = await get<ApiResponse<WorkflowRecord>>(
      `${basePath(workspaceId)}/${workflowId}`,
    );
    return unwrapData(result);
  },

  async create(payload: CreateWorkflowPayload, workspaceId?: string) {
    const result = await post<ApiResponse<WorkflowRecord>>(basePath(workspaceId), payload);
    return unwrapData(result);
  },

  async save(workflowId: string, payload: SaveWorkflowPayload, workspaceId?: string) {
    const result = await put<ApiResponse<WorkflowRecord>>(
      `${basePath(workspaceId)}/${workflowId}`,
      payload,
    );
    return unwrapData(result);
  },

  async remove(workflowId: string, workspaceId?: string) {
    // 204 No Content — client.ts returns data: null
    await del<null>(`${basePath(workspaceId)}/${workflowId}`);
  },
};
