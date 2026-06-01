import "dotenv/config";
import { Worker } from "bullmq";
import {
  connection,
  FormSubmittedJobName,
  WORKFLOW_QUEUE_NAME,
  type FormSubmittedJobData,
} from "@form-builder/shared";
import { handleFormSubmitted } from "./handlers/form-submitted.handler.js";

const worker = new Worker(
  WORKFLOW_QUEUE_NAME,
  async (job) => {
    if (job.name === FormSubmittedJobName) {
      await handleFormSubmitted(job.data as FormSubmittedJobData);
      return;
    }
    console.warn("[engine] unknown job name:", job.name);
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`[engine] completed job ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`[engine] failed job ${job?.id}`, err);
});

console.log(`[engine] listening on queue "${WORKFLOW_QUEUE_NAME}"`);
