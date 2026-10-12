import "@xyflow/react/dist/style.css";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from "react";
import { Link, useParams } from "react-router-dom";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
} from "@xyflow/react";
import { AlertTriangle, ArrowLeft, Loader2, Save } from "lucide-react";
import { ApiError, getWorkspaceId } from "@/shared/api";
import { useWorkflowByIdQuery } from "@/services/workflows/queries";
import { useSaveWorkflowMutation } from "@/services/workflows/mutations";
import { useWorkflowEditorStore } from "../store/workflow-editor-store";
import { isValidWorkflowConnection, toSavePayload } from "../utils/graph";
import type { ActionNodeType } from "../types";
import { nodeTypes } from "./nodes";
import { PALETTE_DRAG_TYPE } from "./nodes/node-meta";
import { WorkflowPalette } from "./workflow-palette";
import { NodeInspector } from "./node-inspector";
import { getWorkflowIssues } from "../utils/validation";

function formatSaveError(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldErrors = error.details?.fieldErrors;
    const details = fieldErrors
      ? Object.entries(fieldErrors)
          .map(
            ([field, messages]) => `${field}: ${(messages ?? []).join(", ")}`,
          )
          .join(" · ")
      : "";
    return details ? `${error.message} — ${details}` : error.message;
  }
  return error instanceof Error ? error.message : "Failed to save workflow";
}

const isActionNodeType = (value: string): value is ActionNodeType =>
  value === "slack" || value === "webhook";

const WorkflowEditorInner: React.FC = () => {
  const { formId, workflowId } = useParams<{
    formId: string;
    workflowId: string;
  }>();
  const workspaceId = useMemo(() => getWorkspaceId(), []);
  const { screenToFlowPosition } = useReactFlow();

  const workflowQuery = useWorkflowByIdQuery(workspaceId, workflowId);
  const saveMutation = useSaveWorkflowMutation(workspaceId);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadedWorkflowId = useWorkflowEditorStore((s) => s.workflowId);
  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const edges = useWorkflowEditorStore((s) => s.edges);
  const name = useWorkflowEditorStore((s) => s.name);
  const isActive = useWorkflowEditorStore((s) => s.isActive);
  const isDirty = useWorkflowEditorStore((s) => s.isDirty);
  const load = useWorkflowEditorStore((s) => s.load);
  const reset = useWorkflowEditorStore((s) => s.reset);
  const onNodesChange = useWorkflowEditorStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowEditorStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowEditorStore((s) => s.onConnect);
  const setName = useWorkflowEditorStore((s) => s.setName);
  const setIsActive = useWorkflowEditorStore((s) => s.setIsActive);
  const addActionNode = useWorkflowEditorStore((s) => s.addActionNode);
  const selectNode = useWorkflowEditorStore((s) => s.selectNode);

  const issues = useMemo(
    () => getWorkflowIssues(nodes, edges, isActive),
    [nodes, edges, isActive],
  );
  const hasBlockingIssues = issues.some((i) => i.blocking);
  const { mutateAsync: saveWorkflow, isPending: isSaving } = saveMutation;
  const canSave =
    isDirty && !isSaving && Boolean(name.trim()) && !hasBlockingIssues;

  // Server data → store (first load, and again after each save via setQueryData)
  useEffect(() => {
    if (workflowQuery.data) load(workflowQuery.data);
  }, [workflowQuery.data, load]);

  // Leaving the page clears the editor
  useEffect(() => () => reset(), [reset]);

  const isValidConnection = useCallback(
    (connection: Connection | Edge) =>
      isValidWorkflowConnection(connection, nodes, edges),
    [nodes, edges],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData(PALETTE_DRAG_TYPE);
      if (!isActionNodeType(type)) return;
      addActionNode(type, screenToFlowPosition({ x: e.clientX, y: e.clientY }));
    },
    [addActionNode, screenToFlowPosition],
  );

  const handleQuickAdd = useCallback(
    (type: ActionNodeType) => {
      const trigger = nodes.find((n) => n.type === "trigger");
      const actionCount = nodes.filter((n) => n.type !== "trigger").length;
      addActionNode(type, {
        x: (trigger?.position.x ?? 0) + 320,
        y: (trigger?.position.y ?? 0) + actionCount * 110,
      });
    },
    [nodes, addActionNode],
  );

  const handleSave = useCallback(async () => {
    if (!workflowId || !canSave) return;
    setSaveError(null);
    try {
      await saveWorkflow({
        workflowId,
        payload: toSavePayload(name.trim(), isActive, nodes, edges),
      });
    } catch (error) {
      setSaveError(formatSaveError(error));
    }
  }, [canSave, edges, isActive, name, nodes, saveWorkflow, workflowId]);

  // Cmd/Ctrl+S saves (and stops the browser's "Save page" dialog)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  // Closing / reloading the tab with unsaved edits → browser confirm dialog
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // older Chrome/Safari need this to show the dialog
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const backLink = (
    <Link
      to={`/forms/${formId}/workflows`}
      onClick={(e) => {
        if (
          isDirty &&
          !confirm("You have unsaved changes. Leave without saving?")
        )
          e.preventDefault();
      }}
      className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
    >
      <ArrowLeft size={14} />
      Workflows
    </Link>
  );

  if (workflowQuery.error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <p className="text-sm text-red-600">{workflowQuery.error.message}</p>
        {backLink}
      </div>
    );
  }

  if (!workflowQuery.data || loadedWorkflowId !== workflowId) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 bg-slate-50 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading workflow…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          {backLink}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workflow name"
            className="min-w-0 flex-1 rounded-md border border-transparent px-2 py-1 text-lg font-semibold text-slate-900 hover:border-slate-200 focus:border-indigo-400 focus:outline-none"
          />

          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive(!isActive)}
            className="flex items-center gap-2 text-sm text-slate-600"
          >
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                isActive ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${
                  isActive ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </span>
            {isActive ? "Active" : "Off"}
          </button>

          {isDirty && (
            <span className="text-xs text-amber-600">Unsaved changes</span>
          )}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSave}
            title={
              hasBlockingIssues
                ? "Fix the highlighted steps first"
                : "Save (⌘/Ctrl+S)"
            }
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save
          </button>
        </div>

        {saveError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {issues.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0" />
            {issues.map((issue, i) => (
              <button
                key={`${issue.nodeId ?? "workflow"}-${i}`}
                type="button"
                onClick={() => issue.nodeId && selectNode(issue.nodeId)}
                disabled={!issue.nodeId}
                className={`rounded-md px-2 py-0.5 text-left ${
                  issue.blocking ? "bg-amber-100 font-medium" : "text-amber-700"
                } enabled:hover:bg-amber-200`}
              >
                {issue.message}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        <WorkflowPalette onQuickAdd={handleQuickAdd} />

        <div
          className="min-w-0 flex-1"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeClick={(_, node) => selectNode(node.id)}
            onPaneClick={() => selectNode(null)}
            deleteKeyCode={["Backspace", "Delete"]}
            fitView
            fitViewOptions={{ maxZoom: 1 }}
          >
            <Background gap={16} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <NodeInspector />
      </div>
    </div>
  );
};

export const WorkflowEditor: React.FC = () => (
  <ReactFlowProvider>
    <WorkflowEditorInner />
  </ReactFlowProvider>
);
