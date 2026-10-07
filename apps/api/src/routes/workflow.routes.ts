import type z from "zod";
import { BadRequestError } from "../errors/app-error";
import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler";
import {
  createWorkflowBodySchema,
  saveWorkflowBodySchema,
} from "../schema/validation/workflow";
import workflowService from "../services/workflow.service";

const workflowRouter = Router({ mergeParams: true });

const requireParam = (
  value: string | string[] | undefined,
  name: string,
): string => {
  if (typeof value !== "string" || !value) {
    throw new BadRequestError(`${name} is required`);
  }
  return value;
};

const parseBody = <S extends z.ZodTypeAny>(
  schema: S,
  body: unknown,
): z.infer<S> => {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError("Invalid body", {
      fieldErrors: parsed.error.flatten().fieldErrors,
      formErrors: parsed.error.flatten().formErrors,
    });
  }
  return parsed.data;
};

workflowRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const workspaceId = requireParam(req.params.workspaceId, "workspaceId");
    const formId =
      typeof req.query.formId === "string" ? req.query.formId : undefined;
    const workflows = await workflowService.listWorkflows(workspaceId, formId);
    res.json({ data: workflows });
  }),
);

workflowRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const workspaceId = requireParam(req.params.workspaceId, "workspaceId");
    const { formId, name } = parseBody(createWorkflowBodySchema, req.body);
    const workflow = await workflowService.createWorkflow(
      workspaceId,
      formId,
      name,
    );
    res.status(201).json({ data: workflow });
  }),
);

workflowRouter.get(
  "/:workflowId",
  asyncHandler(async (req, res) => {
    const workspaceId = requireParam(req.params.workspaceId, "workspaceId");
    const workflowId = requireParam(req.params.workflowId, "workflowId");
    const workflow = await workflowService.getWorkflow(workspaceId, workflowId);
    res.json({ data: workflow });
  }),
);

workflowRouter.put(
  "/:workflowId",
  asyncHandler(async (req, res) => {
    const workspaceId = requireParam(req.params.workspaceId, "workspaceId");
    const workflowId = requireParam(req.params.workflowId, "workflowId");
    const body = parseBody(saveWorkflowBodySchema, req.body);
    const workflow = await workflowService.saveWorkflowGraph(
      workspaceId,
      workflowId,
      body,
    );
    res.json({ data: workflow });
  }),
);

workflowRouter.delete(
  "/:workflowId",
  asyncHandler(async (req, res) => {
    const workspaceId = requireParam(req.params.workspaceId, "workspaceId");
    const workflowId = requireParam(req.params.workflowId, "workflowId");
    await workflowService.deleteWorkflow(workspaceId, workflowId);
    res.status(204).send();
  }),
);

export default workflowRouter;
