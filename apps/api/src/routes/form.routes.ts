import { Router } from "express";
import type { Prisma } from "@form-builder/db";
import { asyncHandler } from "../middleware/async-handler";
import { createFormBodySchema } from "../schema/validation/form";
import { BadRequestError, NotFoundError } from "../errors/app-error";
import formService from "../services/form.service";
import { getAuth } from "../middleware/require-auth";
import { prisma } from "@form-builder/db";

const formRouter = Router();

function getFormIdParam(formId: string | string[] | undefined): string {
  if (typeof formId !== "string" || !formId) {
    throw new BadRequestError("formId is required");
  }
  return formId;
}

function parseFormBody(body: unknown) {
  const parsed = createFormBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError("Invalid body", {
      fieldErrors: parsed.error.flatten().fieldErrors,
      formErrors: parsed.error.flatten().formErrors,
    });
  }
  return parsed.data;
}

formRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const forms = await formService.listForms(getAuth(req).workspaceId);
    res.json({ data: forms });
  }),
);

formRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createFormBodySchema.safeParse(req.body);

    if (!parsed.success) {
      throw new BadRequestError("Invalid body", {
        fieldErrors: parsed.error.flatten().fieldErrors,
        formErrors: parsed.error.flatten().formErrors,
      });
    }

    const { schema } = parsed.data;
    const { workspaceId } = getAuth(req);
    const result = await formService.createForm(
      schema.metadata.title,
      workspaceId,
      schema as unknown as Prisma.InputJsonValue,
    );
    res.status(201).json({ data: result });
  }),
);

formRouter.put(
  "/:formId",
  asyncHandler(async (req, res) => {
    const formId = getFormIdParam(req.params.formId);
    const { schema } = parseFormBody(req.body);
    const { workspaceId } = getAuth(req);
    const result = await formService.updateForm(
      formId,
      schema.metadata.title,
      workspaceId,
      schema as unknown as Prisma.InputJsonValue,
    );
    res.json({ data: result });
  }),
);

formRouter.get(
  "/:formId",
  asyncHandler(async (req, res) => {
    const formId = getFormIdParam(req.params.formId);
    const { form, formVersion } = await formService.getFormById(formId, getAuth(req).workspaceId);
    res.json({
      data: {
        form,
        formVersion,
        schema: formVersion.schema,
      },
    });
  }),
);

formRouter.put(
  "/:formId/publish",
  asyncHandler(async (req, res) => {
    const formId = getFormIdParam(req.params.formId);
    const response = await formService.publishForm(formId, getAuth(req).workspaceId);
    res.json({
      data: response
    });
  }),
);

formRouter.put(
  "/:formId/unpublish",
  asyncHandler(async (req, res) => {
    const formId = getFormIdParam(req.params.formId);
    const response = await formService.unpublishForm(formId, getAuth(req).workspaceId);
    res.json({
      data: response
    });
  }),
);

export default formRouter;
