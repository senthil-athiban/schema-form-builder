import type { FormSubmittedJobData } from "@form-builder/shared";
import { prisma } from "@form-builder/db";

export async function findWorkflowsForFormSubmit(job: FormSubmittedJobData) {
  return prisma.workflow.findMany({
    where: {
      workspaceId: job.workspaceId,
      isActive: true,
      deletedAt: null,
      triggerType: "FORM_SUBMITTED",
      triggerConfig: {
        path: ["formId"],
        equals: job.formId,
      },
    },
    include: {
      nodes: true,
      edges: true,
    },
  });
}
