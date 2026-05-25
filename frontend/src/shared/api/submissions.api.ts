import { get, post } from "./client";
import type {
  ApiListResponse,
  ApiResponse,
  CreateSubmissionPayload,
  SubmissionDetail,
  SubmissionRecord,
} from "./types";

export const submissionsApi = {
  create(formId: string, payload: CreateSubmissionPayload) {
    return post<ApiResponse<SubmissionRecord>>(
      `/forms/${formId}/submissions`,
      payload,
    );
  },

  list(formId: string, params?: { limit?: number; offset?: number }) {
    return get<ApiListResponse<SubmissionDetail>>(
      `/forms/${formId}/submissions`,
      { params },
    );
  },

  getById(formId: string, submissionId: string) {
    return get<ApiResponse<SubmissionDetail>>(
      `/forms/${formId}/submissions/${submissionId}`,
    );
  },
};
