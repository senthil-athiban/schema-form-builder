import type { ApiErrorBody, ApiResult } from "./types";

const DEFAULT_BASE_URL = "http://localhost:3001/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly details?: ApiErrorBody["details"];
  readonly fieldErrors?: ApiErrorBody["fieldErrors"];

  constructor(
    message: string,
    status: number,
    body?: ApiErrorBody | null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = body?.details;
    //@ts-expect-error: fix
    this.fieldErrors = body?.fieldErrors ?? body?.details?.fieldErrors;
  }
}

function getBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL;
  return base.replace(/\/$/, "");
}

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${normalizedPath}`;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: Record<string, string | number | undefined>;
};

export type ApiRequestConfig = Omit<RequestOptions, "body" | "method">;

function appendQueryParams(
  url: string,
  params?: Record<string, string | number | undefined>,
): string {
  if (!params) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

async function parseJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const { body, params, headers, ...init } = options;
  const url = appendQueryParams(buildUrl(path), params);

  const requestHeaders = new Headers(headers);
  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = (await parseJsonBody(response)) as ApiErrorBody | T | null;

  if (!response.ok) {
    const errorBody =
      payload && typeof payload === "object" && "error" in payload
        ? (payload as ApiErrorBody)
        : null;
    throw new ApiError(
      errorBody?.error ?? response.statusText ?? "Request failed",
      response.status,
      errorBody,
    );
  }

  return { data: payload as T, status: response.status };
}

export function get<T>(
  path: string,
  config?: ApiRequestConfig,
): Promise<ApiResult<T>> {
  return apiRequest<T>(path, { ...config, method: "GET" });
}

export function post<T>(
  path: string,
  body?: unknown,
  config?: ApiRequestConfig,
): Promise<ApiResult<T>> {
  return apiRequest<T>(path, { ...config, method: "POST", body });
}

export function put<T>(
  path: string,
  body?: unknown,
  config?: ApiRequestConfig,
): Promise<ApiResult<T>> {
  return apiRequest<T>(path, { ...config, method: "PUT", body });
}

export function del<T>(
  path: string,
  config?: ApiRequestConfig,
): Promise<ApiResult<T>> {
  return apiRequest<T>(path, { ...config, method: "DELETE" });
}

export function getWorkspaceId(): string {
  const workspaceId = import.meta.env.VITE_WORKSPACE_ID;
  if (!workspaceId) {
    throw new Error(
      "VITE_WORKSPACE_ID is not set. Add it to your frontend .env file.",
    );
  }
  return workspaceId;
}
