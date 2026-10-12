import type { WorkspaceRole } from "@form-builder/db";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        workspaceId: string;
        role: WorkspaceRole;
      };
    }
  }
}

export {};
