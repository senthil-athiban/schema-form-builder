import type { NodeProps } from "@xyflow/react";
import type { SlackNodeConfig, WebhookNodeConfig } from "@/shared/api/types";
import type { WorkflowCanvasNode } from "../../types";
import { NodeCard } from "./node-card";

export function TriggerNode({ id, data }: NodeProps<WorkflowCanvasNode>) {
  return <NodeCard nodeId={id} type="trigger" title={data.name} subtitle="When this form is submitted" />;
}

export function SlackNode({ id, data }: NodeProps<WorkflowCanvasNode>) {
  const config = data.config as Partial<SlackNodeConfig>;
  const isComplete = Boolean(config.connectionId && config.channelId);

  let subtitle = "Pick a channel";
  if (isComplete) subtitle = config.channelName ? `#${config.channelName}` : config.channelId!;
  else if (config.channelId) subtitle = "Pick a Slack connection";

  return <NodeCard nodeId={id} type="slack" title={data.name} subtitle={subtitle} warning={!isComplete} />;
}

export function WebhookNode({ id, data }: NodeProps<WorkflowCanvasNode>) {
  const config = data.config as Partial<WebhookNodeConfig>;

  let subtitle = "Set a URL";
  if (config.url) {
    try {
      subtitle = `${config.method ?? "POST"} ${new URL(config.url).host}`;
    } catch {
      subtitle = config.url;
    }
  }

  return <NodeCard nodeId={id} type="webhook" title={data.name} subtitle={subtitle} warning={!config.url} />;
}
