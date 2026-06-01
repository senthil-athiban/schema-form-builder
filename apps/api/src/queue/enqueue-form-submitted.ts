import { Queue } from "bullmq";
import { type FormSubmittedJobData, FormSubmittedJobName, WORKFLOW_QUEUE_NAME, connection } from "@form-builder/shared";

const workflowQueue = new Queue(WORKFLOW_QUEUE_NAME, { connection });

export async function enqueueFormSubmitted(data: FormSubmittedJobData) : Promise<void> {
    try {
        await workflowQueue.add(FormSubmittedJobName, data, {
            jobId: `form-submitted-${data.submissionId}`,
            removeOnComplete: true,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 }
        })
    } catch (error) {
        console.error('[WORKFLOW] failed to enqueue form.submitted for', data.submissionId, error);
    }
}