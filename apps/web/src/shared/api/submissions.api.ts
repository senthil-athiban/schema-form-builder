import { ApiError, buildApiUrl, get, post } from "./client";
import type {
  ApiListResponse,
  ApiResponse,
  CreateSubmissionPayload,
  SubmissionDetail,
  SubmissionFilters,
  SubmissionListItem,
  SubmissionRecord,
} from "./types";

export interface SubmissionListParams extends SubmissionFilters {
  limit?: number;
  offset?: number;
}

export const submissionsApi = {
  create(formId: string, payload: CreateSubmissionPayload) {
    return post<ApiResponse<SubmissionRecord>>(
      `/forms/${formId}/submissions`,
      payload,
    );
  },

  list(formId: string, params?: SubmissionListParams) {
    return get<ApiListResponse<SubmissionListItem>>(
      `/forms/${formId}/submissions`,
      { params: { ...params } },
    );
  },

  getById(formId: string, submissionId: string) {
    return get<ApiResponse<SubmissionDetail>>(
      `/forms/${formId}/submissions/${submissionId}`,
    );
  },

  async export(formId: string, format: "csv" | "json", filters: SubmissionFilters = {}): Promise<Blob> {
    const response = await fetch(
      buildApiUrl(`/forms/${formId}/submissions/export`, { format, ...filters }),
      { credentials: "include" },
    );
    if (!response.ok) {
      let message = response.statusText || "Export failed";
      try {
        const body = (await response.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        // non-JSON error body; keep the status text
      }
      throw new ApiError(message, response.status);
    }
    return response.blob();
  },
};
