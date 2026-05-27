import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { asyncHandler } from "../middleware/async-handler";
import { createFormBodySchema } from "../schema/validation/form";
import { BadRequestError } from "../errors/app-error";
import formService from "../services/form.service";

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
    const workspaceId = req.query.workspaceId;
    if (typeof workspaceId !== "string" || !workspaceId) {
      throw new BadRequestError("workspaceId query parameter is required");
    }

    const forms = await formService.listForms(workspaceId);
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

    const { workspaceId, schema } = parsed.data;
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
    const { workspaceId, schema } = parseFormBody(req.body);
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
    const { form, formVersion } = await formService.getFormById(formId);
    res.json({
      data: {
        form,
        formVersion,
        schema: formVersion.schema,
      },
    });
  }),
);

export default formRouter;
