import { Trash2 } from "lucide-react";
import { useWorkflowEditorStore } from "../store/workflow-editor-store";
import { NODE_META } from "./nodes/node-meta";
import { SlackNodePanel } from "./panels/slack-node-panel";
import { WebhookNodePanel } from "./panels/webhook-node-panel";

export const NodeInspector: React.FC = () => {
  const node = useWorkflowEditorStore((s) => s.nodes.find((n) => n.id === s.selectedNodeId));
  const updateNodeData = useWorkflowEditorStore((s) => s.updateNodeData);
  const removeNode = useWorkflowEditorStore((s) => s.removeNode);

  if (!node || !node.type) {
    return (
      <aside className="w-80 shrink-0 border-l border-slate-200 bg-white p-4 text-sm text-slate-500">
        Select a step to configure it.
      </aside>
    );
  }

  const meta = NODE_META[node.type];
  const Icon = meta.icon;

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 border-b border-slate-200 p-4">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.iconClass}`}>
          <Icon size={16} />
        </div>
        <p className="text-sm font-semibold text-slate-900">{meta.label}</p>
      </div>

      <div className="flex-1 space-y-4 p-4">
        {node.type === "trigger" ? (
          <p className="text-sm text-slate-600">
            This workflow runs every time someone submits the form. Connect it to the steps that should run.
          </p>
        ) : (
          <>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Step name</span>
              <input
                value={node.data.name}
                onChange={(e) => updateNodeData(node.id, { name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
            </label>

            {node.type === "slack" && <SlackNodePanel node={node} />}
            {node.type === "webhook" && <WebhookNodePanel node={node} />}
          </>
        )}
      </div>

      {node.type !== "trigger" && (
        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={() => removeNode(node.id)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={14} />
            Delete step
          </button>
        </div>
      )}
    </aside>
  );
};
