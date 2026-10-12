import type { ActionNodeType } from "../types";
import { NODE_META, PALETTE_DRAG_TYPE } from "./nodes/node-meta";

const ACTION_TYPES: ActionNodeType[] = ["slack", "webhook"];

interface WorkflowPaletteProps {
  onQuickAdd: (type: ActionNodeType) => void;
}

export const WorkflowPalette: React.FC<WorkflowPaletteProps> = ({ onQuickAdd }) => (
  <aside className="w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</p>
    <p className="mt-1 text-xs text-slate-500">Drag onto the canvas, or click to add.</p>

    <div className="mt-3 space-y-2">
      {ACTION_TYPES.map((type) => {
        const meta = NODE_META[type];
        const Icon = meta.icon;
        return (
          <button
            key={type}
            type="button"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(PALETTE_DRAG_TYPE, type);
              e.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => onQuickAdd(type)}
            className="flex w-full cursor-grab items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40 active:cursor-grabbing"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.iconClass}`}>
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">{meta.label}</p>
              <p className="text-xs text-slate-500">{meta.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  </aside>
);
