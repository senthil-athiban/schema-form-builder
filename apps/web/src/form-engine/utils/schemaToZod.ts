import { buildSubmissionSchema } from "@form-builder/shared/form-validation";
import type { EngineQuestion } from "./helpers";

export const createZodSchema = (questions: EngineQuestion[], visibleFields: Set<string>) =>
  buildSubmissionSchema(questions, visibleFields);
