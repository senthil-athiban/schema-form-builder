import { Router } from "express";
import { BadRequestError } from "../errors/app-error";
import { asyncHandler } from "../middleware/async-handler";
import { createConnectSession, listConnections, listSlackChannels } from "../services/integration.service";

const integrationRouter = Router({ mergeParams: true });

const getWorkspaceId = (workspaceId: string | string[] | undefined): string => {
    if (typeof workspaceId !== "string" || !workspaceId) {
        throw new BadRequestError("workspaceId is required");
      }
      return workspaceId;
}

const getConnectionId = (connectionId: string | string[] | undefined): string => {
    if (typeof connectionId !== "string" || !connectionId) {
        throw new BadRequestError("connectionId is required");
    }
    return connectionId
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

integrationRouter.get("/:connectionId/slack/channels", asyncHandler(async (req, res) => {
    const workspaceId = getWorkspaceId(req.params.workspaceId);
    const connectionId = getConnectionId(req.params.connectionId);
    const channels = await listSlackChannels(workspaceId, connectionId);
    res.json({ data: channels });
}));

export default integrationRouter;