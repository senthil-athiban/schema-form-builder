import { Router } from "express";
import type { Prisma } from "@form-builder/db";
import { BadRequestError } from "../errors/app-error.js";
import { asyncHandler } from "../middleware/async-handler.js";
import {
  createSubmission,
  getSubmission,
  listSubmissions,
} from "../services/submission.service.js";

export const submissionsRouter = Router({ mergeParams: true });

function getFormIdParam(formId: string | string[] | undefined): string {
  if (typeof formId !== "string" || !formId) {
    throw new BadRequestError("formId is required");
  }
  return formId;
}

export function parseResponseData(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new BadRequestError("Request body must be a JSON object");
  }

  const { responseData } = body as { responseData?: unknown };

  if (
    !responseData ||
    typeof responseData !== "object" ||
    Array.isArray(responseData)
  ) {
    throw new BadRequestError("responseData must be a non-null object");
  }

  return responseData as Record<string, unknown>;
}

export function parseMetadata(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== "object" || Array.isArray(body)) return undefined;

  const { metadata } = body as { metadata?: unknown };

  if (metadata === undefined) return undefined;
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
    throw new BadRequestError("metadata must be a JSON object when provided");
  }

  return metadata as Record<string, unknown>;
}

export function parseVersion(body: unknown): number | undefined {
  if (!body || typeof body !== "object" || Array.isArray(body)) return undefined;

  const { version } = body as { version?: unknown };

  if (version === undefined) return undefined;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    throw new BadRequestError("version must be a positive integer when provided");
  }

  return version;
}

submissionsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const formId = getFormIdParam(req.params.formId);

    const metadata = parseMetadata(req.body);
    const version = parseVersion(req.body);

    const submission = await createSubmission(formId, {
      responseData: parseResponseData(req.body),
      ...(metadata !== undefined && {
        metadata: metadata as Prisma.InputJsonValue,
      }),
      ...(version !== undefined && { version }),
    });

    res.status(201).json({ data: submission });
  }),
);

submissionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const formId = getFormIdParam(req.params.formId);

    const limit = req.query.limit
      ? Number.parseInt(String(req.query.limit), 10)
      : undefined;
    const offset = req.query.offset
      ? Number.parseInt(String(req.query.offset), 10)
      : undefined;

    const result = await listSubmissions(formId, {
      ...(limit !== undefined && { limit }),
      ...(offset !== undefined && { offset }),
    });
    res.json({ data: result.submissions, meta: { total: result.total, limit: result.limit, offset: result.offset } });
  }),
);

submissionsRouter.get(
  "/:submissionId",
  asyncHandler(async (req, res) => {
    const formId = getFormIdParam(req.params.formId);
    const submissionId = req.params.submissionId;

    if (typeof submissionId !== "string" || !submissionId) {
      throw new BadRequestError("submissionId is required");
    }

    const submission = await getSubmission(formId, submissionId);
    res.json({ data: submission });
  }),
);
