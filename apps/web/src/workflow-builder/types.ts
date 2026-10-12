import type { Edge, Node } from "@xyflow/react";
import type { WorkflowActionProvider } from "@/shared/api/types";

export type CanvasNodeType = "trigger" | "slack" | "webhook";

export type ActionNodeType = Exclude<CanvasNodeType, "trigger">;

export type WorkflowNodeData = {
  name: string;
  provider: WorkflowActionProvider | null;
  config: Record<string, unknown>;
};

export type WorkflowCanvasNode = Node<WorkflowNodeData, CanvasNodeType>;
export type WorkflowCanvasEdge = Edge;
