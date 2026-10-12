import { SlackNode, TriggerNode, WebhookNode } from "./workflow-nodes";

// Defined at module level; React Flow warns if this object changes between renders
export const nodeTypes = {
  trigger: TriggerNode,
  slack: SlackNode,
  webhook: WebhookNode,
};
