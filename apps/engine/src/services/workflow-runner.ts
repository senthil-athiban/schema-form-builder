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
import { executeSlackMessage, parseSlackConfig } from "../executors/slack.executor.js";

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

  if (!trigger) {
    throw new Error(`Workflow ${workflow.id} has no TRIGGER node`);
  }

  // lookup nodeId -> node
  const nodeById = new Map(workflow.nodes.map((n) => [n.id, n]));

  const outgoing = new Map<string, string[]>();
  for (const edge of workflow.edges) {
    if (!nodeById.has(edge.sourceNodeId) || !nodeById.has(edge.targetNodeId)) continue;
    const targets = outgoing.get(edge.sourceNodeId) ?? [];
    targets.push(edge.targetNodeId);
    outgoing.set(edge.sourceNodeId, targets);
  }

  // 1. Only nodes reachable from the trigger run
  const reachable = new Set<string>([trigger.id]);

  const stack = [trigger.id];
  while (stack.length > 0) {
    const id = stack.pop()!;
    for (const target of outgoing.get(id) ?? []) {
      if (!reachable.has(target)) {
        reachable.add(target);
        stack.push(target);
      }
    }
  }

  // 2. Topological order: a node runs only after all of its parents ran
  const inDegree = new Map<string, number>();
  for (const id of reachable) inDegree.set(id, 0);
  for (const id of reachable) {
    for (const target of outgoing.get(id) ?? []) {
      inDegree.set(target, inDegree.get(target)! + 1)
    }
  }


  const queue = [trigger.id];
  const ordered: WorkflowNode[] = [];

  while(queue.length > 0) {
    const id = queue.shift()!;
    ordered.push(nodeById.get(id)!);
    for (const target of outgoing.get(id) ?? []) {
      const remaining = inDegree.get(target)! - 1;
      inDegree.set(target, remaining)
      if (remaining === 0) queue.push(target);
    }
  }

  if (ordered.length !== reachable.size) {
    throw new Error(`Workflow ${workflow.id} contains a loop`);
  }

  console.log("[engine] execution order:", ordered.map((n) => `${n.name} (${n.category})`).join(" → "));
  return ordered;
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

  if (node.category === WorkflowNodeCategory.ACTION && node.provider === IntegrationProvider.SLACK) {
    const { channel, connectionId, message } = parseSlackConfig(node.config);

    const connection = await prisma.integrationConnection.findFirst({
      where: {
        ...(connectionId ? { id: connectionId } : {}),
        workspaceId: submission.workspaceId,
        provider: IntegrationProvider.SLACK,
        isActive: true
      }
    });

    if (!connection) {
      throw new Error(
        connectionId
          ? `Slack connection ${connectionId} is missing or inactive`
          : "No active Slack connection for this workspace",
      );
    }

    const payload = buildWebhookPayload(submission);
    const text = [
      ...(message ? [message, ""] : []),
      `New submission on ${payload.form.name}`,
      `Submission: ${payload.submission.id}`,
      `Data: ${JSON.stringify(payload.submission.responseData)}`,
    ].join("\n");

    return executeSlackMessage(connection.externalAccountId, channel, text);
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
