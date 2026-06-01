import { prisma } from "@form-builder/db";
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

  for (const workflow of workflows) {
    try {
      await runWorkflowForSubmission(workflow, job, submission);
      console.log(`[engine] workflow ${workflow.id} completed successfully`);
    } catch (error) {
      console.error(`[engine] workflow ${workflow.id} failed`, error);
      throw error;
    }
  }
}
