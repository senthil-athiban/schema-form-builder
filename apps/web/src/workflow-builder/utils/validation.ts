import type { SlackNodeConfig, WebhookNodeConfig } from "@/shared/api/types";
import type { WorkflowCanvasEdge, WorkflowCanvasNode } from "../types";

export const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export function getNodeIssue(node: WorkflowCanvasNode): string | null {
  if (node.type === "slack") {
    const config = node.data.config as Partial<SlackNodeConfig>;
    if (!config.connectionId) return "Pick a Slack connection";
    if (!config.channelId) return "Pick a channel";
    return null;
  }

  if (node.type === "webhook") {
    const config = node.data.config as Partial<WebhookNodeConfig>;
    if (!config.url) return "Set a URL";
    if (!isValidHttpUrl(config.url)) return "URL is not valid";
    return null;
  }

  return null;
}

export type WorkflowIssue = {
  nodeId: string | null;
  message: string;
  blocking: boolean;
};

export function getWorkflowIssues(
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
  isActive: boolean,
): WorkflowIssue[] {
  const issues: WorkflowIssue[] = [];
  const actions = nodes.filter((n) => n.type !== "trigger");

  for (const node of actions) {
    const issue = getNodeIssue(node);
    if (issue) issues.push({ nodeId: node.id, message: `${node.data.name}: ${issue}`, blocking: true });
  }

  if (isActive && actions.length === 0) {
    issues.push({ nodeId: null, message: "Add at least one step before turning the workflow on", blocking: true });
  }

  const trigger = nodes.find((n) => n.type === "trigger");
  if (trigger) {
    const reachable = new Set([trigger.id]);
    const stack = [trigger.id];
    while (stack.length > 0) {
      const id = stack.pop()!;
      for (const e of edges) {
        if (e.source === id && !reachable.has(e.target)) {
          reachable.add(e.target);
          stack.push(e.target);
        }
      }
    }
    for (const node of actions) {
      if (!reachable.has(node.id)) {
        issues.push({ nodeId: node.id, message: `${node.data.name}: not connected, it won't run`, blocking: false });
      }
    }
  }

  return issues;
}
