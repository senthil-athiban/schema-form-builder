import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { asyncHandler } from "../middleware/async-handler";
import { createFormBodySchema } from "../schema/validation/form";
import { BadRequestError } from "../errors/app-error";
import formService from '../services/form.service';

const formRouter = Router();

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
    const result = await formService.createForm(schema.metadata.title, workspaceId, schema as unknown as Prisma.InputJsonValue);
    res.status(201).json({ data: result });
  }),
);

formRouter.put(
  "/:formId",
  asyncHandler(async (req, res) => {
    // validate schema, call updateForm
  }),
);
formRouter.get(
  "/:formId",
  asyncHandler(async (req, res) => {
    // call getFormById
  }),
);

export default formRouter;
