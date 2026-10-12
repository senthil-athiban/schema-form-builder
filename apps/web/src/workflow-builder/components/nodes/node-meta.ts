import { MessageSquare, Webhook, Zap, type LucideIcon } from "lucide-react";
import type { CanvasNodeType } from "../../types";

export const PALETTE_DRAG_TYPE = "application/x-workflow-node";

export const NODE_META: Record<
  CanvasNodeType,
  { label: string; description: string; icon: LucideIcon; iconClass: string }
> = {
  trigger: {
    label: "Form submitted",
    description: "Starts the workflow",
    icon: Zap,
    iconClass: "bg-amber-50 text-amber-600",
  },
  slack: {
    label: "Slack message",
    description: "Post to a channel",
    icon: MessageSquare,
    iconClass: "bg-purple-50 text-purple-600",
  },
  webhook: {
    label: "Webhook",
    description: "Send JSON to a URL",
    icon: Webhook,
    iconClass: "bg-sky-50 text-sky-600",
  },
};
