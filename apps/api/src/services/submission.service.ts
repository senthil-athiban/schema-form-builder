import { FormStatus, Prisma, prisma } from "@form-builder/db";
import { formatAnswer, getAnswerQuestions } from "@form-builder/shared/form-validation";
import { toCsv } from "../lib/csv.js";
import { BadRequestError, FormClosedError, NotFoundError } from "../errors/app-error.js";
import { validateSubmissionResponse } from "../lib/validateSubmission.js";
import type { FormSchema } from "../types/form-schema.js";
import { enqueueFormSubmitted } from "../queue/enqueue-form-submitted.js";

export interface CreateSubmissionInput {
  responseData: Record<string, unknown>;
  metadata?: Prisma.InputJsonValue;
  version?: number;
}

export interface SubmissionFilters {
  search?: string;
  from?: Date;
  to?: Date;
  sort?: "asc" | "desc";
}

export interface ListSubmissionsOptions extends SubmissionFilters {
  limit?: number;
  offset?: number;
}

export type ExportFormat = "csv" | "json";

const EXPORT_MAX_ROWS = 10_000;

function parseFormSchema(schema: Prisma.JsonValue): FormSchema {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    throw new BadRequestError("Form schema is invalid");
  }
  return schema as unknown as FormSchema;
}

const getPublishedForm = async (formId: string) => {
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

const getFormVersion = async (formId: string, version: number) => {
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

const submissionCreatedSelect = {
  id: true,
  formId: true,
  formVersionId: true,
  workspaceId: true,
  submittedAt: true,
} as const;

const notifyFormSubmitted = async (submission: {
  id: string;
  formId: string;
  formVersionId: string;
  workspaceId: string;
}) => {
  await enqueueFormSubmitted({
    submissionId: submission.id,
    formId: submission.formId,
    workspaceId: submission.workspaceId,
    formVersionId: submission.formVersionId,
  });
}

export const createSubmissionByPublicToken = async (
  token: string,
  input: CreateSubmissionInput,
) => {
  const form = await prisma.form.findUnique({
    where: { publicToken: token, status: FormStatus.PUBLISHED, deletedAt: null }
  });

  if (!form) throw new NotFoundError("Form not found");

  const publishedVersion = form.publishedVersion;
  if (form.status !== FormStatus.PUBLISHED || !publishedVersion) throw new FormClosedError();

  const formVersion = await getFormVersion(form.id, publishedVersion);
  const schema = parseFormSchema(formVersion.schema);
  const responseData = validateSubmissionResponse(schema, input.responseData);

  const submission = await prisma.submission.create({
    data: {
      workspaceId: form.workspaceId,
      formId: form.id,
      formVersionId: formVersion.id,
      responseData: responseData as Prisma.InputJsonValue,
      ...(input.metadata !== undefined && { metadata: input.metadata }),
    },
    select: submissionCreatedSelect,
  });

  await notifyFormSubmitted(submission);
  return submission;
}

export const createSubmission = async(
  formId: string,
  input: CreateSubmissionInput,
) => {
  const form = await getPublishedForm(formId);
  const version = input.version ?? form.latestVersion;
  const formVersion = await getFormVersion(formId, version);
  const schema = parseFormSchema(formVersion.schema);

  const responseData = validateSubmissionResponse(schema, input.responseData);

  const submission = await prisma.submission.create({
    data: {
      workspaceId: form.workspaceId,
      formId: form.id,
      formVersionId: formVersion.id,
      responseData: responseData as Prisma.InputJsonValue,
      ...(input.metadata !== undefined && { metadata: input.metadata }),
    },
    select: submissionCreatedSelect,
  });

  await notifyFormSubmitted(submission);
  return submission;
}

export const getSubmission = async(formId: string, submissionId: string) => {
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

const getActiveForm = async (formId: string) => {
  const form = await prisma.form.findFirst({
    where: { id: formId, deletedAt: null },
  });
  if (!form) throw new NotFoundError("Form not found");
  return form;
}

const toLikePattern = (search: string) => `%${search.replace(/[\\%_]/g, "\\$&")}%`;

const buildSubmissionWhere = async(
  formId: string,
  filters: SubmissionFilters,
): Promise<Prisma.SubmissionWhereInput> => {
  const where: Prisma.SubmissionWhereInput = { formId };

  if (filters.from || filters.to) {
    where.submittedAt = {
      ...(filters.from && { gte: filters.from }),
      ...(filters.to && { lte: filters.to }),
    };
  }

  if (filters.search) {
    const matches = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT s.id FROM "Submission" s
      WHERE s."formId" = ${formId}
        AND EXISTS (
          SELECT 1 FROM jsonb_each_text(s."responseData") AS answer(key, value)
          WHERE answer.value ILIKE ${toLikePattern(filters.search)}
        )
    `);
    where.id = { in: matches.map((m) => m.id) };
  }

  return where;
}

export const listSubmissions = async(
  formId: string,
  options: ListSubmissionsOptions = {},
) => {
  await getActiveForm(formId);

  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  const where = await buildSubmissionWhere(formId, options);

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      orderBy: { submittedAt: options.sort ?? "desc" },
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
    prisma.submission.count({ where }),
  ]);

  return { submissions, total, limit, offset };
}

export const exportSubmissions = async (formId: string, format: ExportFormat, filters: SubmissionFilters) => {
  const form = await getActiveForm(formId);
  const formVersion = await getFormVersion(formId, form.latestVersion);
  const questions = getAnswerQuestions(parseFormSchema(formVersion.schema));

  const submissions = await prisma.submission.findMany({
    where: await buildSubmissionWhere(formId, filters),
    orderBy: { submittedAt: filters.sort ?? "desc" },
    take: EXPORT_MAX_ROWS,
    select: { id: true, submittedAt: true, responseData: true },
  });

  const answersOf = (responseData: Prisma.JsonValue) =>
    (responseData && typeof responseData === "object" && !Array.isArray(responseData)
      ? responseData
      : {}) as Record<string, unknown>;

  const baseName = form.name.trim().replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "form";

  if (format === "json") {
    const rows = submissions.map((s) => {
      const answers = answersOf(s.responseData);
      return {
        id: s.id,
        submittedAt: s.submittedAt.toISOString(),
        answers: Object.fromEntries(questions.map((q) => [q.label || q.name, answers[q.id] ?? null])),
      };
    });
    return {
      filename: `${baseName}-submissions.json`,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(rows, null, 2),
    };
  }

  const header = ["Submission ID", "Submitted at", ...questions.map((q) => q.label || q.name)];
  const rows = submissions.map((s) => {
    const answers = answersOf(s.responseData);
    return [s.id, s.submittedAt.toISOString(), ...questions.map((q) => formatAnswer(q, answers[q.id]))];
  });

  return {
    filename: `${baseName}-submissions.csv`,
    contentType: "text/csv; charset=utf-8",
    body: toCsv([header, ...rows]),
  };
}