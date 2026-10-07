import {
  IntegrationProvider,
  prisma,
  type Prisma,
  WorkflowNodeCategory,
  WorkflowTriggerType,
} from "@form-builder/db";
import { BadRequestError, NotFoundError } from "../errors/app-error";
import type { SaveWorkflowBody } from "../schema/validation/workflow";
import { assertGraphShape, normalizeNodes } from "../utils/workflow";

// ---------- helpers ----------

const verifyWorkspaceId = async (workspaceId: string) => {
  return prisma.workspace.findFirst({ where: { id: workspaceId } });
};

const findFormInWorkspace = async (workspaceId: string, formId: string) => {
  return prisma.form.findFirst({
    where: { id: formId, workspaceId, deletedAt: null },
  });
};

const findWorkflowInWorkspace = async (
  workspaceId: string,
  workflowId: string,
) => {
  const workflow = await prisma.workflow.findFirst({
    where: {
      workspaceId,
      id: workflowId,
      deletedAt: null
    },
  });
  if (!workflow) throw new NotFoundError("Workflow not found");
  return workflow;
};

// ---------- CRUD ----------

const listWorkflows = async (workspaceId: string, formId?: string) => {
  const workspace = await verifyWorkspaceId(workspaceId);
  if (!workspace) throw new NotFoundError("Workspace not found");

  return prisma.workflow.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      triggerType: WorkflowTriggerType.FORM_SUBMITTED,
      ...(formId
        ? { triggerConfig: { path: ["formId"], equals: formId } }
        : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      isActive: true,
      triggerConfig: true,
      triggerType: true,
      _count: { select: { nodes: { where: { deletedAt: null } } } },
    },
  });
};

const getWorkflow = async (workspaceId: string, workflowId: string) => {
  const workflow = await prisma.workflow.findFirst({
    where: {
      workspaceId,
      id: workflowId,
      deletedAt: null,
    },
    include: {
      nodes: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      edges: true,
    },
  });
  if (!workflow) throw new NotFoundError("Workflow not found");
  return workflow;
};

const createWorkflow = async (
  workspaceId: string,
  formId: string,
  name: string,
) => {
  const workspace = await verifyWorkspaceId(workspaceId);
  if (!workspace) throw new NotFoundError("Workspace not found");

  const form = await findFormInWorkspace(workspaceId, formId);
  if (!form) throw new NotFoundError("Form not found");

  const workflowId = await prisma.$transaction(async (tx) => {
    const workflow = await tx.workflow.create({
      data: {
        workspaceId,
        name,
        isActive: false,
        triggerType: WorkflowTriggerType.FORM_SUBMITTED,
        triggerConfig: { formId },
      },
    });

    await tx.workflowNode.create({
      data: {
        workflowId: workflow.id,
        name: "Form submitted",
        category: WorkflowNodeCategory.TRIGGER,
        positionX: 0,
        positionY: 0,
        config: {},
      },
    });

    return workflow.id;
  });

  return getWorkflow(workspaceId, workflowId!);
};

const saveWorkflowGraph = async (
  workspaceId: string,
  workflowId: string,
  body: SaveWorkflowBody,
) => {
  await findWorkflowInWorkspace(workspaceId, workflowId);

  assertGraphShape(body.nodes, body.edges);
  const nodes = await normalizeNodes(workspaceId, body.nodes);
  const nodeIds = nodes.map((n) => n.id);

  const foreign = await prisma.workflowNode.findFirst({
    where: {
      id: { in: nodeIds },
      workflowId: { not: workflowId },
    },
    select: {
      id: true,
    },
  });

  if (foreign)
    throw new BadRequestError(`Node id ${foreign.id} is already used`);

  await prisma.$transaction(async (tx) => {
    await tx.workflow.update({
      where: {
        id: workflowId,
      },
      data: {
        name: body.name,
        isActive: body.isActive,
      },
    });

    for (const node of nodes) {
      const data = {
        name: node.name,
        category: node.category as WorkflowNodeCategory,
        provider: (node.provider ?? null) as IntegrationProvider | null,
        action: node.action ?? null,
        positionX: node.positionX,
        positionY: node.positionY,
        config: node.config as Prisma.InputJsonValue,
      };

      await tx.workflowNode.upsert({
        where: { id: node.id },
        create: { id: node.id, workflowId, ...data },
        update: { ...data, deletedAt: null },
      });
    }

    // Clean up: Removed from canvas -> soft delete
    await tx.workflowNode.updateMany({
      where: { workflowId, id: { notIn: nodeIds }, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    await tx.workflowEdge.deleteMany({
      where: {
        workflowId,
      },
    });

    if (body.edges.length > 0) {
      await tx.workflowEdge.createMany({
        data: body.edges.map((e) => ({
          workflowId,
          sourceNodeId: e.sourceNodeId,
          targetNodeId: e.targetNodeId,
        })),
      });
    }
  });

  return getWorkflow(workspaceId, workflowId);
};

const deleteWorkflow = async (workspaceId: string, workflowId: string) => {
  await findWorkflowInWorkspace(workspaceId, workflowId);
  await prisma.workflow.update({
    where: { id: workflowId },
    data: { deletedAt: new Date(), isActive: false },
  });
};

export default {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  saveWorkflowGraph,
  deleteWorkflow,
};
