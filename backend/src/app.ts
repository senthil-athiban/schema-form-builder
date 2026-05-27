import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/error-handler.js";
import { submissionsRouter } from "./routes/submissions.routes.js";
import formRouter from "./routes/form.routes.js";
import publicRouter from "./routes/public.routes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/v1/forms/:formId/submissions", submissionsRouter);
  app.use("/api/v1/public/forms", publicRouter);
  app.use("/api/v1/form", formRouter);

  app.use(errorHandler);

  return app;
}
