import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { SubmissionValidationError } from "../lib/validateSubmission.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof SubmissionValidationError) {
    res.status(err.statusCode).json({
      error: err.message,
      fieldErrors: err.fieldErrors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
