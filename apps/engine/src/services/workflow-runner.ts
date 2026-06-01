import {
  IntegrationProvider,
  prisma,
  WorkflowExecutionStatus,
  WorkflowNodeCategory,
  StepExecutionStatus,
  type Prisma,
  type Workflow,
  type WorkflowEdge,
  type WorkflowNode,
} from "@form-builder/db";
import type { FormSubmittedJobData } from "@form-builder/shared";
import {
  executeWebhook,
  type WebhookConfig,
} from "../executors/webhook.executor.js";

type WorkflowWithGraph = Workflow & {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

type SubmissionWithForm = Prisma.SubmissionGetPayload<{
  include: { form: true };
}>;

function parseWebhookConfig(config: unknown): WebhookConfig {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Webhook node config must be an object");
  }

  const raw = config as Record<string, unknown>;
  if (typeof raw.url !== "string" || !raw.url.trim()) {
    throw new Error("Webhook node config.url is required");
  }

  const method = raw.method;
  if (
    method !== undefined &&
    method !== "POST" &&
    method !== "GET" &&
    method !== "PUT"
  ) {
    throw new Error("Webhook node config.method must be POST, GET, or PUT");
  }

  const headers = raw.headers;
  if (
    headers !== undefined &&
    (typeof headers !== "object" || headers === null || Array.isArray(headers))
  ) {
    throw new Error("Webhook node config.headers must be an object");
  }

  return {
    url: raw.url,
    ...(method !== undefined && { method }),
    ...(headers !== undefined && {
      headers: headers as Record<string, string>,
    }),
  };
}

function getNodesInExecutionOrder(workflow: WorkflowWithGraph): WorkflowNode[] {
  const trigger = workflow.nodes.find((n) => n.category === WorkflowNodeCategory.TRIGGER);
  const nodes: WorkflowNode[] = [];

  if (!trigger) {
    throw new Error(`Workflow ${workflow.id} has no TRIGGER node`);
  }

  nodes.push(trigger);

  let current = trigger;
  while (true) {

    const edge = workflow.edges.find((e) => e.sourceNodeId === current.id);
    if (!edge) break;

    const next = workflow.nodes.find((n) => n.id === edge.targetNodeId);
    if (!next) {
      throw new Error(`Workflow ${workflow.id} has no target node for trigger edge`);
    }
    current = next;
    nodes.push(next);
    if (next.category === WorkflowNodeCategory.FLOW_CONTROL /* or END type */) break;
    current = next;
  }
  console.log('nodes:', nodes.map((n) => `${n.name} - ${n.category}, `));
  return nodes;

  // const edge = workflow.edges.find((e) => e.sourceNodeId === trigger.id);
  // if (!edge) {
  //   throw new Error(`Workflow ${workflow.id} has no edge from trigger`);
  // }

  // const action = workflow.nodes.find((n) => n.id === edge.targetNodeId);
  // if (!action) {
  //   throw new Error(`Workflow ${workflow.id} has no target node for trigger edge`);
  // }

  // return [trigger, action];
}

function buildWebhookPayload(submission: SubmissionWithForm) {
  return {
    event: "form.submitted" as const,
    submission: {
      id: submission.id,
      formId: submission.formId,
      responseData: submission.responseData,
      submittedAt: submission.submittedAt,
    },
    form: {
      id: submission.form.id,
      name: submission.form.name,
    },
  };
}

async function runNode(
  node: WorkflowNode,
  submission: SubmissionWithForm,
): Promise<unknown> {
  if (node.category === WorkflowNodeCategory.TRIGGER) {
    return { skipped: true, reason: "trigger" };
  }

  if (
    node.category === WorkflowNodeCategory.ACTION &&
    node.provider === IntegrationProvider.WEBHOOK
  ) {
    const config = parseWebhookConfig(node.config);
    return executeWebhook(config, buildWebhookPayload(submission));
  }

  throw new Error(
    `Unsupported node ${node.id} (category=${node.category}, provider=${node.provider ?? "none"})`,
  );
}

export async function runWorkflowForSubmission(
  workflow: WorkflowWithGraph,
  job: FormSubmittedJobData,
  submission: SubmissionWithForm,
): Promise<void> {
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      submissionId: submission.id,
      status: WorkflowExecutionStatus.RUNNING,
      triggerPayload: job as unknown as Prisma.InputJsonValue,
    },
  });

  try {
    const nodes = getNodesInExecutionOrder(workflow);

    for (const node of nodes) {
      const step = await prisma.workflowStepExecution.create({
        data: {
          workflowExecutionId: execution.id,
          nodeId: node.id,
          status: StepExecutionStatus.RUNNING,
          input: buildWebhookPayload(submission) as unknown as Prisma.InputJsonValue,
        },
      });

      try {
        const output = await runNode(node, submission);
        await prisma.workflowStepExecution.update({
          where: { id: step.id },
          data: {
            status: StepExecutionStatus.SUCCESS,
            output: output as Prisma.InputJsonValue,
            completedAt: new Date(),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await prisma.workflowStepExecution.update({
          where: { id: step.id },
          data: {
            status: StepExecutionStatus.FAILED,
            error: { message } as Prisma.InputJsonValue,
            completedAt: new Date(),
          },
        });
        throw error;
      }
    }

    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: WorkflowExecutionStatus.SUCCESS,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: WorkflowExecutionStatus.FAILED,
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
