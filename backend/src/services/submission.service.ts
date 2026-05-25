import { FormStatus, type Prisma } from "@prisma/client";
import { BadRequestError, NotFoundError } from "../errors/app-error.js";
import { validateSubmissionResponse } from "../lib/validateSubmission.js";
import { prisma } from "../db/prisma.js";
import type { FormSchema } from "../types/form-schema.js";

export interface CreateSubmissionInput {
  responseData: Record<string, unknown>;
  metadata?: Prisma.InputJsonValue;
  version?: number;
}

export interface ListSubmissionsOptions {
  limit?: number;
  offset?: number;
}

function parseFormSchema(schema: Prisma.JsonValue): FormSchema {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    throw new BadRequestError("Form schema is invalid");
  }
  return schema as FormSchema;
}

async function getPublishedForm(formId: string) {
  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      deletedAt: null,
      status: FormStatus.PUBLISHED,
    },
  });

  if (!form) {
    throw new NotFoundError("Published form not found");
  }

  return form;
}

async function getFormVersion(formId: string, version: number) {
  const formVersion = await prisma.formVersion.findUnique({
    where: {
      formId_version: { formId, version },
    },
  });

  if (!formVersion) {
    throw new NotFoundError(`Form version ${version} not found`);
  }

  return formVersion;
}

export async function createSubmission(
  formId: string,
  input: CreateSubmissionInput,
) {
  const form = await getPublishedForm(formId);
  const version = input.version ?? form.latestVersion;
  const formVersion = await getFormVersion(formId, version);
  const schema = parseFormSchema(formVersion.schema);

  validateSubmissionResponse(schema, input.responseData);

  const submission = await prisma.submission.create({
    data: {
      workspaceId: form.workspaceId,
      formId: form.id,
      formVersionId: formVersion.id,
      responseData: input.responseData as Prisma.InputJsonValue,
      metadata: input.metadata,
    },
    select: {
      id: true,
      formId: true,
      formVersionId: true,
      submittedAt: true,
    },
  });

  return submission;
}

export async function getSubmission(formId: string, submissionId: string) {
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, formId },
    select: {
      id: true,
      formId: true,
      formVersionId: true,
      responseData: true,
      metadata: true,
      submittedAt: true,
      createdAt: true,
    },
  });

  if (!submission) {
    throw new NotFoundError("Submission not found");
  }

  return submission;
}

export async function listSubmissions(
  formId: string,
  options: ListSubmissionsOptions = {},
) {
  const form = await prisma.form.findFirst({
    where: { id: formId, deletedAt: null },
    select: { id: true },
  });

  if (!form) {
    throw new NotFoundError("Form not found");
  }

  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where: { formId },
      orderBy: { submittedAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        formVersionId: true,
        responseData: true,
        metadata: true,
        submittedAt: true,
      },
    }),
    prisma.submission.count({ where: { formId } }),
  ]);

  return { submissions, total, limit, offset };
}
