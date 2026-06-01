import { config } from "dotenv";
config();
import { Worker } from "bullmq";
import {
  connection,
  FormSubmittedJobName,
  WORKFLOW_QUEUE_NAME,
} from "@form-builder/shared";

const worker = new Worker(
  WORKFLOW_QUEUE_NAME,
  async (job) => {
    if (job.name === FormSubmittedJobName) {
      console.log("[workflow-worker] form.submitted", job.data);
      return;
    }
    console.warn("[workflow-worker] unknown job name:", job.name);
  },
  {
    connection: connection,
  },
);

worker.on("completed", (job) => {
  console.log(`[workflow-worker] completed job ${job.id}`);
});
worker.on("failed", (job, err) => {
  console.error(`[workflow-worker] failed job ${job?.id}`, err);
});
console.log(`[workflow-worker] listening on queue "${WORKFLOW_QUEUE_NAME}"`);
