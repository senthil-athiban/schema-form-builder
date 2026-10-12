import type { Request, RequestHandler } from "express";
import { NotFoundError, UnauthorizedError } from "../errors/app-error";
import { asyncHandler } from "./async-handler";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { createPersonalWorkspace } from "../lib/workspace";
import { prisma } from "@form-builder/db";

export const getAuth = (req: Request) => {
    if (!req.auth) throw new UnauthorizedError();
    return req.auth;
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) throw new UnauthorizedError();

    // One workspace per user for now; the oldest membership is "theirs"
    const membership = await prisma?.workspaceUser.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
    }) ??
    (await createPersonalWorkspace(session.user));

    req.auth = {
        userId: session.user.id,
        workspaceId: membership.workspaceId,
        role: membership.role
    }

    next();
})

export const requireWorkspaceParam: RequestHandler = (req, _res, next) => {
    if (req.params.workspaceId !== getAuth(req).workspaceId) {
        next(new NotFoundError("Workspace not found"));
        return;
    }
    next();
}

export const requireFormInWorkspace = asyncHandler(async (req, _res, next) => {
    const formId = req.params.formId;
    const form =
      typeof formId === "string"
        ? await prisma.form.findFirst({
            where: { id: formId, workspaceId: getAuth(req).workspaceId, deletedAt: null },
            select: { id: true },
          })
        : null;
  
    // 404, not 403: don't reveal that a form exists in someone else's workspace
    if (!form) throw new NotFoundError("Form not found");
    next();
  });