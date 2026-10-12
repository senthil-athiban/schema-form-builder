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
  publicToken?: string | null;
  publishedVersion?: number | null;
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

export interface SubmissionListItem {
  id: string;
  formVersionId: string;
  responseData: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  submittedAt: string;
}

export interface SubmissionFilters {
  search?: string;
  from?: string;
  to?: string;
  sort?: "asc" | "desc";
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

// ---------------------------- Slack ----------------------------

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  isMember: boolean;
}

// ---------------------------- Workflows ----------------------------

export type WorkflowNodeCategory = "TRIGGER" | "ACTION";
export type WorkflowActionProvider = "SLACK" | "WEBHOOK";
export type WebhookMethod = "POST" | "GET" | "PUT";

export interface SlackNodeConfig {
  connectionId: string;
  channelId: string;
  channelName?: string;
  message?: string;
}

export interface WebhookNodeConfig {
  url: string;
  method?: WebhookMethod;
  headers?: Record<string, string>;
}

export interface WorkflowNodeRecord {
  id: string;
  workflowId: string;
  name: string;
  category: WorkflowNodeCategory;
  provider: WorkflowActionProvider | null;
  action: string | null;
  positionX: number;
  positionY: number;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowEdgeRecord {
  id: string;
  workflowId: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface WorkflowRecord {
  id: string;
  workspaceId: string;
  name: string;
  isActive: boolean;
  triggerType: "FORM_SUBMITTED";
  triggerConfig: { formId: string };
  nodes: WorkflowNodeRecord[];
  edges: WorkflowEdgeRecord[];
}

export interface WorkflowListItem {
  id: string;
  name: string;
  isActive: boolean;
  triggerType: "FORM_SUBMITTED";
  triggerConfig: { formId: string };
  _count: { nodes: number };
}

export interface CreateWorkflowPayload {
  formId: string;
  name: string;
}

export interface WorkflowNodeInput {
  id: string;
  name: string;
  category: WorkflowNodeCategory;
  provider?: WorkflowActionProvider | null;
  action?: string | null;
  positionX: number;
  positionY: number;
  config: Record<string, unknown>;
}

export interface WorkflowEdgeInput {
  sourceNodeId: string;
  targetNodeId: string;
}

export interface SaveWorkflowPayload {
  name: string;
  isActive: boolean;
  nodes: WorkflowNodeInput[];
  edges: WorkflowEdgeInput[];
}

export interface MeResult {
  user: { id: string; name: string | null; email: string; image: string | null; emailVerified: boolean };
  workspace: { id: string; name: string; slug: string };
  role: "OWNER" | "ADMIN" | "EDITOR" | "ANALYST" | "VIEWER";
}
