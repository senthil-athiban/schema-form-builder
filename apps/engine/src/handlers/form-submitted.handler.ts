import { WorkflowExecutionStatus, prisma } from "@form-builder/db";
import type { FormSubmittedJobData } from "@form-builder/shared";
import { findWorkflowsForFormSubmit } from "../services/workflow-matcher.js";
import { runWorkflowForSubmission } from "../services/workflow-runner.js";

export async function handleFormSubmitted(
  job: FormSubmittedJobData,
): Promise<void> {
  const workflows = await findWorkflowsForFormSubmit(job);

  if (workflows.length === 0) {
    console.log(
      `[engine] no active FORM_SUBMITTED workflows for form ${job.formId}`,
    );
    return;
  }

  const submission = await prisma.submission.findUnique({
    where: { id: job.submissionId },
    include: { form: true },
  });

  if (!submission) {
    throw new Error(`Submission not found: ${job.submissionId}`);
  }

  console.log(
    `[engine] running ${workflows.length} workflow(s) for submission ${job.submissionId}`,
  );

  const failed: string[] = [];

  for (const workflow of workflows) {
    // BullMQ retries the whole job; don't re-run workflows that already succeeded
    const alreadySucceeded = await prisma.workflowExecution.findFirst({
      where: {
        workflowId: workflow.id,
        submissionId: submission.id,
        status: WorkflowExecutionStatus.SUCCESS,
      },
      select: { id: true },
    });

    if (alreadySucceeded) {
      console.log(`[engine] workflow ${workflow.id} already succeeded for this submission, skipping`);
      continue;
    }

    try {
      await runWorkflowForSubmission(workflow, job, submission);
      console.log(`[engine] workflow ${workflow.id} completed successfully`);
    } catch (error) {
      console.error(`[engine] workflow ${workflow.id} failed`, error);
      failed.push(workflow.id);
    }
  }

  // Throw after all workflows ran, so BullMQ retries only the failed ones
  if (failed.length > 0) {
    throw new Error(`${failed.length} workflow(s) failed: ${failed.join(", ")}`);
  }
}
