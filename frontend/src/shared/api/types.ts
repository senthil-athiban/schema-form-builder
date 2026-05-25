import type { FormSchema } from "../types";

export interface ApiResult<T> {
  data: T;
  status: number;
}

export interface ApiErrorBody {
  error: string;
  details?: {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
  fieldErrors?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiListMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: ApiListMeta;
}

export interface CreateFormPayload {
  workspaceId: string;
  schema: FormSchema;
}

export interface FormRecord {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: string;
  latestVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormVersionRecord {
  id: string;
  formId: string;
  version: number;
  schema: FormSchema;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormResult {
  form: FormRecord;
  formVersion: FormVersionRecord;
}

export interface CreateSubmissionPayload {
  responseData: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  version?: number;
}

export interface SubmissionRecord {
  id: string;
  formId: string;
  formVersionId: string;
  submittedAt: string;
}

export interface SubmissionDetail extends SubmissionRecord {
  responseData: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
