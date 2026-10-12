import type { NodeProps } from "@xyflow/react";
import type { SlackNodeConfig, WebhookNodeConfig } from "@/shared/api/types";
import type { WorkflowCanvasNode } from "../../types";
import { getNodeIssue } from "../../utils/validation";
import { NodeCard } from "./node-card";

export function TriggerNode({ id, data }: NodeProps<WorkflowCanvasNode>) {
  return <NodeCard nodeId={id} type="trigger" title={data.name} subtitle="When this form is submitted" />;
}

export function SlackNode(props: NodeProps<WorkflowCanvasNode>) {
  const { id, data } = props;
  const config = data.config as Partial<SlackNodeConfig>;
  const issue = getNodeIssue({ ...props, type: "slack", position: { x: 0, y: 0 } });
  const subtitle = issue ?? (config.channelName ? `#${config.channelName}` : config.channelId!);

  return <NodeCard nodeId={id} type="slack" title={data.name} subtitle={subtitle} warning={Boolean(issue)} />;
}

export function WebhookNode(props: NodeProps<WorkflowCanvasNode>) {
  const { id, data } = props;
  const config = data.config as Partial<WebhookNodeConfig>;
  const issue = getNodeIssue({ ...props, type: "webhook", position: { x: 0, y: 0 } });
  const subtitle = issue ?? `${config.method ?? "POST"} ${new URL(config.url!).host}`;

  return <NodeCard nodeId={id} type="webhook" title={data.name} subtitle={subtitle} warning={Boolean(issue)} />;
}
