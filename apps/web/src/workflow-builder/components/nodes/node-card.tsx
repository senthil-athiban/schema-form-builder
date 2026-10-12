import { Handle, Position } from "@xyflow/react";
import { AlertCircle } from "lucide-react";
import type { CanvasNodeType } from "../../types";
import { useWorkflowEditorStore } from "../../store/workflow-editor-store";
import { NODE_META } from "./node-meta";

const handleStyle = { width: 10, height: 10, background: "#94a3b8", border: "2px solid white" };

interface NodeCardProps {
  nodeId: string;
  type: CanvasNodeType;
  title: string;
  subtitle: string;
  warning?: boolean;
}

export const NodeCard: React.FC<NodeCardProps> = ({ nodeId, type, title, subtitle, warning }) => {
  const isSelected = useWorkflowEditorStore((s) => s.selectedNodeId === nodeId);
  const meta = NODE_META[type];
  const Icon = meta.icon;

  return (
    <div
      className={`w-60 rounded-xl border bg-white px-3 py-2.5 shadow-sm transition ${
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-200"
          : warning
            ? "border-amber-300"
            : "border-slate-200"
      }`}
    >
      {type !== "trigger" && <Handle type="target" position={Position.Left} style={handleStyle} />}

      <div className="flex items-center gap-2.5">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.iconClass}`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{title}</p>
          <p className={`flex items-center gap-1 truncate text-xs ${warning ? "text-amber-600" : "text-slate-500"}`}>
            {warning && <AlertCircle size={12} className="shrink-0" />}
            <span className="truncate">{subtitle}</span>
          </p>
        </div>
      </div>

      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
};
