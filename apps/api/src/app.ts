import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/error-handler.js";
import { submissionsRouter } from "./routes/submissions.routes.js";
import formRouter from "./routes/form.routes.js";
import publicRouter from "./routes/public.routes.js";
import integrationRouter from "./routes/integration.routes.js";
import nangoWebhookRouter from "./routes/nango-webhook.routes.js";
import workflowRouter from "./routes/workflow.routes.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { requireAuth, requireFormInWorkspace, requireWorkspaceParam } from "./middleware/require-auth.js";
import meRouter from "./routes/me.routes.js";

const API_V1 = "/api/v1";

export function createApp() {
  const app = express();
  if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

  app.use(
    cors({
      origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    }),
  );

  app.all("/api/auth/*splat", toNodeHandler(auth));

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

  // Public: respondents and Nango have no session
  app.use(`${API_V1}/public/forms`, publicRouter);
  app.use(`${API_V1}/integrations/nango`, nangoWebhookRouter);

  // Private: signed-in users, scoped to their workspace
  app.use(`${API_V1}/me`, requireAuth, meRouter);
  app.use(`${API_V1}/form`, requireAuth, formRouter);
  app.use(`${API_V1}/forms/:formId/submissions`, requireAuth, requireFormInWorkspace, submissionsRouter);
  app.use(`${API_V1}/workspaces/:workspaceId/integrations`, requireAuth, requireWorkspaceParam, integrationRouter);
  app.use(`${API_V1}/workspaces/:workspaceId/workflows`, requireAuth, requireWorkspaceParam, workflowRouter);

  app.use(errorHandler);



  return app;
}
