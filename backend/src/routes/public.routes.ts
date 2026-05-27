import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { BadRequestError } from "../errors/app-error.js";
import formService from "../services/form.service.js";
import {
  parseMetadata,
  parseResponseData,
  parseVersion,
} from "./submissions.routes.js";
import submissionService from "../services/submission.service.js";
import type { Prisma } from "@prisma/client";

const publicRouter = Router();

function getTokenParam(token: string | string[] | undefined): string {
  if (typeof token !== "string" || !token) {
    throw new BadRequestError("token is required");
  }
  return token;
}

publicRouter.get(
  "/:token",
  asyncHandler(async (req, res) => {
    const token = getTokenParam(req.params.token);
    const result = await formService.getPublicFormByToken(token);
    res.json({ data: result });
  }),
);

publicRouter.post(
  "/:token/submissions",
  asyncHandler(async (req, res) => {
    const publicToken = req.params.token as unknown as string;
    const responseData = parseResponseData(req.body);
    const metadata = parseMetadata(req.body);
    const submission = await submissionService.createSubmissionByPublicToken(publicToken, {
      responseData,
      ...(metadata !== undefined && {
        metadata: metadata as Prisma.InputJsonValue,
      }),
    });
    res.status(201).json({ data: submission });
  }),
);
export default publicRouter;
