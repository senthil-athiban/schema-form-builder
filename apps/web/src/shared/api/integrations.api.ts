import { get, post, getWorkspaceId } from "./client";
import type { ApiResponse, ApiResult, SlackChannel } from "./types";
import type {
  CreateConnectSessionResult,
  IntegrationConnectionItem,
} from "./types";

export const integrationsApi = {
  async list(workspaceId?: string) {
    const id = workspaceId ?? getWorkspaceId();
    // Backend returns { connections }, not { data }
    const result = await get<{ connections: IntegrationConnectionItem[] }>(
      `/workspaces/${id}/integrations`,
    );
    return { data: result.data.connections, status: result.status };
  },

  async createSession(provider: "SLACK", workspaceId?: string) {
    const id = workspaceId ?? getWorkspaceId();
    const result = await post<ApiResponse<CreateConnectSessionResult>>(
      `/workspaces/${id}/integrations/session`,
      { provider },
    );
    return { data: result.data.data, status: result.status } satisfies ApiResult<CreateConnectSessionResult>;
  },

  async listSlackChannels(connectionId: string, workspaceId?: string) {
    const id = workspaceId ?? getWorkspaceId();
    const result = await get<ApiResponse<SlackChannel[]>>(
      `/workspaces/${id}/integrations/${connectionId}/slack/channels`,
    );
    return { data: result.data.data, status: result.status } satisfies ApiResult<SlackChannel[]>;
  },

};