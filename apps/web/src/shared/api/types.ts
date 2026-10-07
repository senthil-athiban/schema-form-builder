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

export type FormStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface FormRecord {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: FormStatus;
  latestVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormListItem {
  id: string;
  name: string;
  description: string | null;
  status: FormStatus;
  latestVersion: number;
  publicToken: string | null;
  publishedVersion: number | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    submissions: number;
  };
}

export interface PublishFormResult {
  form: FormRecord & {
    publicToken: string | null;
    publishedVersion: number | null;
  };
  publicToken: string;
  publishedVersion: number;
}

export interface PublicFormResult {
  formId: string;
  name: string;
  description: string | null;
  publishedVersion: number;
  schema: FormSchema;
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
  versionCreated?: boolean;
}

export interface GetFormResult {
  form: FormRecord;
  formVersion: FormVersionRecord;
  schema: FormSchema;
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

/** Row shape returned by `GET /forms/:formId/submissions` (list). */
export interface SubmissionListItem {
  id: string;
  formVersionId: string;
  responseData: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  submittedAt: string;
}

export interface SubmissionDetail extends SubmissionRecord {
  responseData: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface IntegrationConnectionItem {
  id: string;
  provider: string;
  name: string | null;
  externalAccountId: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateConnectSessionResult {
  connectLink: string;
  expiresAt: string;
}