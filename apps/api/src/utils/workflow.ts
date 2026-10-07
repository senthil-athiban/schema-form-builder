import {
  IntegrationProvider,
  prisma
} from "@form-builder/db";
import { BadRequestError } from "../errors/app-error";
import {
  slackNodeConfigSchema,
  webhookNodeConfigSchema,
  type WorkflowEdgeInput,
  type WorkflowNodeInput,
} from "../schema/validation/workflow";

const DEFAULT_ACTION: Record<"SLACK" | "WEBHOOK", string> = {
  SLACK: "post-message",
  WEBHOOK: "http-request",
};

const assertGraphShape = (nodes: WorkflowNodeInput[], edges: WorkflowEdgeInput[]) => {
  const ids = new Set<string>();
  for (const node of nodes) {
    if (ids.has(node.id))
      throw new BadRequestError(`Duplicate node id ${node.id}`);
    ids.add(node.id);
  }

  const triggers = nodes.filter((n) => n.category === "TRIGGER");
  if (triggers.length !== 1) {
    throw new BadRequestError("Workflow must have exactly one trigger node");
  }

  const triggerId = triggers[0]!.id;

  const seenEdges = new Set<string>();
  for (const edge of edges) {
    if (!ids.has(edge.sourceNodeId) || !ids.has(edge.targetNodeId)) {
      throw new BadRequestError(
        "Edge points to a node that is not in the workflow",
      );
    }
    if (edge.sourceNodeId === edge.targetNodeId) {
      throw new BadRequestError("A node cannot connect to itself!");
    }
    if (edge.targetNodeId === triggerId) {
      throw new BadRequestError("Nothing can connect into the trigger");
    }
    const key = `${edge.sourceNodeId}->${edge.targetNodeId}`;
    if (seenEdges.has(key)) throw new BadRequestError("Duplicate edge");
    seenEdges.add(key);
  }

  assertAcyclic([...ids], edges);
};

const assertAcyclic = (nodeIds: string[], edges: WorkflowEdgeInput[]) => {
  const next = new Map<string, string[]>();
  for (const id of nodeIds) next.set(id, []);
  for (const edge of edges)
    next.get(edge.sourceNodeId)?.push(edge.targetNodeId);

  // 0 = unvisited, 1 = on current path, 2 = done
  const state = new Map<string, 0 | 1 | 2>();

  const hasCycleFrom = (id: string): boolean => {
    state.set(id, 1);
    for (const target of next.get(id)!) {
      const s = state.get(target) ?? 0;
      if (s === 1) return true; //cycle detected;
      if (s === 0 && hasCycleFrom(target)) return true; // cycle detected
    }
    state.set(id, 2);
    return false;
  };

  for (const id of nodeIds) {
    if ((state.get(id) ?? 0) === 0 && hasCycleFrom(id)) {
      throw new BadRequestError("Workflow cannot contain a loop");
    }
  }
};

const normalizeNodes = async (
  workspaceId: string,
  nodes: WorkflowNodeInput[],
) => {
  const slackConnectionIds = new Set<string>();

  const normalized = nodes.map((node) => {
    if (node.category === "TRIGGER") {
      return { ...node, provider: null, action: null, config: {} };
    }

    if (!node.provider) {
      throw new BadRequestError(`Action node "${node.name}" needs a provider`);
    }

    const schema =
      node.provider === "SLACK"
        ? slackNodeConfigSchema
        : webhookNodeConfigSchema;
    const parsed = schema.safeParse(node.config);
    if (!parsed.success) {
      throw new BadRequestError(`Invalid config on node "${node.name}"`, {
        nodeId: node.id,
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    if (node.provider === "SLACK") {
      slackConnectionIds.add(
        (parsed.data as { connectionId: string }).connectionId,
      );
    }

    return {
      ...node,
      action: node.action ?? DEFAULT_ACTION[node.provider],
      config: parsed.data as Record<string, unknown>,
    };
  });

  if (slackConnectionIds.size > 0) {
    const found = await prisma.integrationConnection.findMany({
      where: {
        id: { in: [...slackConnectionIds] },
        workspaceId,
        provider: IntegrationProvider.SLACK,
        isActive: true,
      },
      select: { id: true },
    });
    if (found.length !== slackConnectionIds.size) {
      throw new BadRequestError(
        "A Slack node uses a connection that is missing or inactive",
      );
    }
  }

  return normalized;
};

export {
    assertAcyclic,
    assertGraphShape,
    normalizeNodes
}