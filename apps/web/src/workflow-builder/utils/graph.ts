import type { Connection, XYPosition } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import type {
  SaveWorkflowPayload,
  WorkflowNodeRecord,
  WorkflowRecord,
} from "@/shared/api/types";
import type {
  ActionNodeType,
  CanvasNodeType,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
} from "../types";

// ---------- API → canvas ----------
function toCanvasType(node: WorkflowNodeRecord): CanvasNodeType {
  if (node.category === "TRIGGER") return "trigger";
  return node.provider === "SLACK" ? "slack" : "webhook";
}

function toCanvasConfig(node: WorkflowNodeRecord): Record<string, unknown> {
  const config = { ...(node.config ?? {}) };
  if (node.provider === "SLACK" && typeof config.channel === "string" && !config.channelId) {
    config.channelId = config.channel;
    delete config.channel;
  }
  return config;
}

export function toCanvas(record: WorkflowRecord): {
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
} {
  const nodes: WorkflowCanvasNode[] = record.nodes.map((n) => ({
    id: n.id,
    type: toCanvasType(n),
    position: { x: n.positionX, y: n.positionY },
    deletable: n.category !== "TRIGGER",
    data: {
      name: n.name,
      provider: n.provider,
      config: n.category === "TRIGGER" ? {} : toCanvasConfig(n),
    },
  }));

  const edges: WorkflowCanvasEdge[] = record.edges.map((e) => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
  }));

  return { nodes, edges };
}

// ---------- canvas → API ----------

export function toSavePayload(
  name: string,
  isActive: boolean,
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
): SaveWorkflowPayload {
  return {
    name,
    isActive,
    nodes: nodes.map((n) => ({
      id: n.id,
      name: n.data.name,
      category: n.type === "trigger" ? "TRIGGER" : "ACTION",
      provider: n.type === "trigger" ? null : n.data.provider,
      positionX: Math.round(n.position.x),
      positionY: Math.round(n.position.y),
      config: n.type === "trigger" ? {} : n.data.config,
    })),
    edges: edges.map((e) => ({ sourceNodeId: e.source, targetNodeId: e.target })),
  };
}

// ---------- new nodes from the palette ----------

const NEW_NODE_DEFAULTS: Record<ActionNodeType, Pick<WorkflowCanvasNode["data"], "name" | "provider" | "config">> = {
  slack: { name: "Send Slack message", provider: "SLACK", config: {} },
  webhook: { name: "Send webhook", provider: "WEBHOOK", config: { method: "POST" } },
};

export function createActionNode(type: ActionNodeType, position: XYPosition): WorkflowCanvasNode {
  const defaults = NEW_NODE_DEFAULTS[type];
  return {
    id: uuidv4(),
    type,
    position,
    data: { ...defaults, config: { ...defaults.config } },
  };
}

// ---------- connection rules (mirror the API's checks) ----------

function hasPath(edges: WorkflowCanvasEdge[], from: string, to: string): boolean {
  const stack = [from];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (id === to) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const e of edges) if (e.source === id) stack.push(e.target);
  }
  return false;
}

export function isValidWorkflowConnection(
  connection: Connection | WorkflowCanvasEdge,
  nodes: WorkflowCanvasNode[],
  edges: WorkflowCanvasEdge[],
): boolean {
  const { source, target } = connection;
  if (!source || !target || source === target) return false;

  const targetNode = nodes.find((n) => n.id === target);
  if (!targetNode || targetNode.type === "trigger") return false;

  if (edges.some((e) => e.source === source && e.target === target)) return false;

  // Adding source → target makes a loop if target can already reach source
  return !hasPath(edges, target, source);
}
