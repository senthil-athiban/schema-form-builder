import type { FormSchema } from "../types";
import { get, post, put } from "./client";
import type {
  ApiResponse,
  CreateFormPayload,
  CreateFormResult,
} from "./types";

export const formsApi = {
  create(payload: CreateFormPayload) {
    return post<ApiResponse<CreateFormResult>>("/form", payload);
  },

  getById(formId: string) {
    return get<ApiResponse<{ schema: FormSchema }>>(`/form/${formId}`);
  },

  update(formId: string, payload: { workspaceId: string; schema: FormSchema }) {
    return put<ApiResponse<CreateFormResult>>(`/form/${formId}`, payload);
  },
};
