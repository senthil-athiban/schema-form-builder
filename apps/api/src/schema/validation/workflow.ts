import z from "zod";

// ---------- node configs (stored in WorkflowNode.config) ----------

export const slackNodeConfigSchema = z.object({
  connectionId: z.string().min(1, "Pick a Slack connection"),
  channelId: z.string().min(1, "Pick a Slack channel"),
  channelName: z.string().optional(),
  message: z.string().max(2000).optional(),
});

export const webhookNodeConfigSchema = z.object({
  url: z.string().url("Webhook url must be a valid URL"),
  method: z.enum(["POST", "GET", "PUT"]).optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export type SlackNodeConfig = z.infer<typeof slackNodeConfigSchema>;
export type WebhookNodeConfig = z.infer<typeof webhookNodeConfigSchema>;

// ---------- graph ----------

export const workflowNodeSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  category: z.enum(["TRIGGER", "ACTION"]),
  provider: z.enum(["SLACK", "WEBHOOK"]).nullable().optional(),
  action: z.string().max(100).nullable().optional(),
  positionX: z.number(),
  positionY: z.number(),
  config: z.record(z.string(), z.unknown()).default({}),
});

export const workflowEdgeSchema = z.object({
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
});

export type WorkflowNodeInput = z.infer<typeof workflowNodeSchema>;
export type WorkflowEdgeInput = z.infer<typeof workflowEdgeSchema>;

// ---------- request bodies ----------

export const createWorkflowBodySchema = z.object({
  formId: z.string().min(1),
  name: z.string().min(1).max(200),
});

export const saveWorkflowBodySchema = z.object({
  name: z.string().min(1).max(200),
  isActive: z.boolean(),
  nodes: z.array(workflowNodeSchema).min(1).max(50),
  edges: z.array(workflowEdgeSchema).max(100),
});

export type SaveWorkflowBody = z.infer<typeof saveWorkflowBodySchema>;
