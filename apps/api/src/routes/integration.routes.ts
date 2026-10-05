import { Router } from "express";
import { BadRequestError } from "../errors/app-error";
import { asyncHandler } from "../middleware/async-handler";
import { createConnectSession, listConnections } from "../services/integration.service";

const integrationRouter = Router({ mergeParams: true });

const getWorkspaceId = (workspaceId: string | string[] | undefined): string => {
    if (typeof workspaceId !== "string" || !workspaceId) {
        throw new BadRequestError("workspaceId is required");
      }
      return workspaceId;
}

integrationRouter.get("/", asyncHandler(async (req, res) => {
    const workspaceId = getWorkspaceId(req.params.workspaceId);
    const connections = await listConnections(workspaceId);
    res.json({ connections });
}));

integrationRouter.post("/session", asyncHandler(async (req, res) => {
    const workspaceId = getWorkspaceId(req.params.workspaceId);
    const provider = typeof req.body?.provider === "string" ? req.body.provider : "";
    const result = await createConnectSession(workspaceId, provider);
    res.status(201).json({ data: result });
}));

export default integrationRouter;