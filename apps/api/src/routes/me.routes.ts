import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { getAuth } from "../middleware/require-auth";
import { prisma } from "@form-builder/db";

const meRouter = Router();

meRouter.get(
    "/",
    asyncHandler(async (req, res) => {
        const { role, userId, workspaceId } = getAuth(req);
        const [user, workspace] = await Promise.all([
            prisma.user.findUnique({
              where: { id: userId },
              select: { id: true, name: true, email: true, image: true, emailVerified: true },
            }),
            prisma.workspace.findUnique({
              where: { id: workspaceId },
              select: { id: true, name: true, slug: true },
            }),
          ]);
          res.json({ data: { user, workspace, role } });
    })
)

export default meRouter;