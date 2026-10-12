import { create } from "zustand";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import type { WorkflowRecord } from "@/shared/api/types";
import type {
  ActionNodeType,
  WorkflowCanvasEdge,
  WorkflowCanvasNode,
  WorkflowNodeData,
} from "../types";
import { createActionNode, isValidWorkflowConnection, toCanvas } from "../utils/graph";

interface WorkflowEditorState {
  workflowId: string | null;
  name: string;
  isActive: boolean;
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
  selectedNodeId: string | null;
  isDirty: boolean;
}

interface WorkflowEditorActions {
  load: (record: WorkflowRecord) => void;
  reset: () => void;

  // React Flow wiring
  onNodesChange: (changes: NodeChange<WorkflowCanvasNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowCanvasEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  // Editing
  setName: (name: string) => void;
  setIsActive: (isActive: boolean) => void;
  addActionNode: (type: ActionNodeType, position: XYPosition) => void;
  updateNodeData: (nodeId: string, patch: Partial<Omit<WorkflowNodeData, "config">>) => void;
  updateNodeConfig: (nodeId: string, patch: Record<string, unknown>) => void;
  removeNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
}

const initialState: WorkflowEditorState = {
  workflowId: null,
  name: "",
  isActive: false,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDirty: false,
};

// Selecting or measuring nodes is not an edit
const isEditChange = (change: NodeChange | EdgeChange) =>
  change.type !== "select" && change.type !== "dimensions";

export const useWorkflowEditorStore = create<WorkflowEditorState & WorkflowEditorActions>()(
  (set, get) => ({
    ...initialState,

    load: (record) => {
      const { nodes, edges } = toCanvas(record);
      const selected = get().selectedNodeId;
      set({
        workflowId: record.id,
        name: record.name,
        isActive: record.isActive,
        nodes,
        edges,
        selectedNodeId: selected && nodes.some((n) => n.id === selected) ? selected : null,
        isDirty: false,
      });
    },

    reset: () => set(initialState),

    onNodesChange: (changes) => {
      const triggerIds = new Set(get().nodes.filter((n) => n.type === "trigger").map((n) => n.id));
      const allowed = changes.filter((c) => !(c.type === "remove" && triggerIds.has(c.id)));
      if (allowed.length === 0) return;

      const removedIds = new Set(allowed.flatMap((c) => (c.type === "remove" ? [c.id] : [])));

      set((state) => ({
        nodes: applyNodeChanges(allowed, state.nodes),
        selectedNodeId:
          state.selectedNodeId && removedIds.has(state.selectedNodeId) ? null : state.selectedNodeId,
        isDirty: state.isDirty || allowed.some(isEditChange),
      }));
    },

    onEdgesChange: (changes) => {
      set((state) => ({
        edges: applyEdgeChanges(changes, state.edges),
        isDirty: state.isDirty || changes.some(isEditChange),
      }));
    },

    onConnect: (connection) => {
      const { nodes, edges } = get();
      if (!isValidWorkflowConnection(connection, nodes, edges)) return;
      set({
        edges: addEdge({ ...connection, id: uuidv4() }, edges),
        isDirty: true,
      });
    },

    setName: (name) => set({ name, isDirty: true }),

    setIsActive: (isActive) => set({ isActive, isDirty: true }),

    addActionNode: (type, position) => {
      const node = createActionNode(type, position);
      set((state) => ({
        nodes: [...state.nodes, node],
        selectedNodeId: node.id,
        isDirty: true,
      }));
    },

    updateNodeData: (nodeId, patch) => {
      set((state) => ({
        nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)),
        isDirty: true,
      }));
    },

    updateNodeConfig: (nodeId, patch) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, config: { ...n.data.config, ...patch } } } : n,
        ),
        isDirty: true,
      }));
    },

    removeNode: (nodeId) => {
      const node = get().nodes.find((n) => n.id === nodeId);
      if (!node || node.type === "trigger") return;
      set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== nodeId),
        edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        isDirty: true,
      }));
    },

    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  }),
);
