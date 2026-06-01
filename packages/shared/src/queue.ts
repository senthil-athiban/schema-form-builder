export const WORKFLOW_QUEUE_NAME = "workflow";

export const FormSubmittedJobName = "form.submitted";

export type FormSubmittedJobData = {
  submissionId: string;
  formId: string;
  workspaceId: string;
  formVersionId: string;
};
