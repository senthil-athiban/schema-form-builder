import {
  FormStatus,
  IntegrationProvider,
  WorkspaceRole,
  WorkflowNodeCategory,
  WorkflowTriggerType,
} from "./generated/client/index.js";
import { prisma } from "./client.js";

const SEED_WORKFLOW_ID = "seed-form-submitted-workflow";
const SEED_TRIGGER_NODE_ID = "seed-wf-trigger";
const SEED_WEBHOOK_NODE_ID = "seed-wf-webhook";
const SEED_EDGE_ID = "seed-wf-edge-trigger-webhook";

const sampleFormSchema = {
  id: "contact-form",
  version: "1",
  metadata: {
    title: "Contact Us",
    description: "Get in touch with our team",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  settings: {
    submitButton: { label: "Submit", position: "center" },
  },
  pages: [
    {
      id: "page-1",
      label: "Contact",
      order: 0,
      sections: [
        {
          id: "section-1",
          label: "Your details",
          order: 0,
          questions: [
            {
              id: "q-name",
              type: "text",
              label: "Full name",
              name: "fullName",
              required: true,
              order: 0,
            },
            {
              id: "q-email",
              type: "email",
              label: "Email",
              name: "email",
              required: true,
              order: 1,
            },
            {
              id: "q-message",
              type: "textarea",
              label: "Message",
              name: "message",
              required: false,
              order: 2,
            },
          ],
        },
      ],
    },
  ],
  validation: [],
};

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "senthil@example.com",
    },
    update: {},
    create: {
      name: "Senthil",
      email: "senthil@example.com",
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: {
      slug: "indiclinic",
    },
    update: {},
    create: {
      name: "Indiclinic",
      slug: "indiclinic",
    },
  });

  await prisma.workspaceUser.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: WorkspaceRole.OWNER,
    },
  });

  const form = await prisma.form.upsert({
    where: { id: "seed-contact-form" },
    update: {
      status: FormStatus.PUBLISHED,
      latestVersion: 1,
    },
    create: {
      id: "seed-contact-form",
      workspaceId: workspace.id,
      name: "Contact Us",
      description: "Sample published form for testing submissions",
      status: FormStatus.PUBLISHED,
      latestVersion: 1,
    },
  });

  await prisma.formVersion.upsert({
    where: {
      formId_version: {
        formId: form.id,
        version: 1,
      },
    },
    update: {
      schema: sampleFormSchema,
    },
    create: {
      formId: form.id,
      version: 1,
      schema: sampleFormSchema,
    },
  });

  const webhookUrl =
    process.env.SEED_WEBHOOK_URL ??
    "https://webhook.site/00000000-0000-0000-0000-000000000000";

  const workflow = await prisma.workflow.upsert({
    where: { id: SEED_WORKFLOW_ID },
    update: {
      isActive: true,
      triggerConfig: { formId: form.id },
    },
    create: {
      id: SEED_WORKFLOW_ID,
      workspaceId: workspace.id,
      name: "Contact form → webhook",
      isActive: true,
      triggerType: WorkflowTriggerType.FORM_SUBMITTED,
      triggerConfig: { formId: form.id },
    },
  });

  await prisma.workflowNode.upsert({
    where: { id: SEED_TRIGGER_NODE_ID },
    update: {
      name: "Form submitted",
      category: WorkflowNodeCategory.TRIGGER,
      config: {},
    },
    create: {
      id: SEED_TRIGGER_NODE_ID,
      workflowId: workflow.id,
      name: "Form submitted",
      category: WorkflowNodeCategory.TRIGGER,
      positionX: 0,
      positionY: 0,
      config: {},
    },
  });

  await prisma.workflowNode.upsert({
    where: { id: SEED_WEBHOOK_NODE_ID },
    update: {
      name: "Send webhook",
      category: WorkflowNodeCategory.ACTION,
      provider: IntegrationProvider.WEBHOOK,
      config: { url: webhookUrl, method: "POST" },
    },
    create: {
      id: SEED_WEBHOOK_NODE_ID,
      workflowId: workflow.id,
      name: "Send webhook",
      category: WorkflowNodeCategory.ACTION,
      provider: IntegrationProvider.WEBHOOK,
      action: "send",
      positionX: 280,
      positionY: 0,
      config: { url: webhookUrl, method: "POST" },
    },
  });

  await prisma.workflowEdge.upsert({
    where: { id: SEED_EDGE_ID },
    update: {
      sourceNodeId: SEED_TRIGGER_NODE_ID,
      targetNodeId: SEED_WEBHOOK_NODE_ID,
    },
    create: {
      id: SEED_EDGE_ID,
      workflowId: workflow.id,
      sourceNodeId: SEED_TRIGGER_NODE_ID,
      targetNodeId: SEED_WEBHOOK_NODE_ID,
    },
  });

  console.log("✅ Seed data created successfully");
  console.log({
    workspaceId: workspace.id,
    userId: user.id,
    formId: form.id,
    workflowId: workflow.id,
    webhookUrl,
    submitUrl: `POST /api/v1/forms/${form.id}/submissions`,
  });

  if (!process.env.SEED_WEBHOOK_URL) {
    console.warn(
      "⚠️  Set SEED_WEBHOOK_URL in packages/db/.env to your webhook.site URL for live webhook tests.",
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
