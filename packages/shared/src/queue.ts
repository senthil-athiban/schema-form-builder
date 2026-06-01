export const WORKFLOW_QUEUE_NAME = "workflow";

export type FormSubmittedJobName = "form.submitted";

export type FormSubmittedJobData = {
  submissionId: string;
  formId: string;
  workspaceId: string;
  formVersionId: string;
};
