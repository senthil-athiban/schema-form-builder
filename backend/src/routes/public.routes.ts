import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { BadRequestError } from "../errors/app-error.js";
import formService from "../services/form.service.js";

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

export default publicRouter;
