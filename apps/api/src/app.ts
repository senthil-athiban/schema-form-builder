import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/error-handler.js";
import { submissionsRouter } from "./routes/submissions.routes.js";
import formRouter from "./routes/form.routes.js";
import publicRouter from "./routes/public.routes.js";
import integrationRouter from "./routes/integration.routes.js";
import nangoWebhookRouter from "./routes/nango-webhook.routes.js";

const API_V1 = "/api/v1";
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(`${API_V1}/forms/:formId/submissions`, submissionsRouter);
  app.use(`${API_V1}/public/forms`, publicRouter);
  app.use(`${API_V1}/form`, formRouter);

  app.use(`${API_V1}/workspaces/:workspaceId/integrations`, integrationRouter);
  app.use("/api/v1/integrations/nango", nangoWebhookRouter);
  app.use(errorHandler);

  return app;
}
