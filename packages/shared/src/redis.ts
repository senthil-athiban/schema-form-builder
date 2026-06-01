import { Queue, type ConnectionOptions } from "bullmq";
import { WORKFLOW_QUEUE_NAME } from "./queue.js";

export const connection: ConnectionOptions = {
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
};
