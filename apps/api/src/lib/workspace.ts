import { randomBytes } from "node:crypto";
import { prisma, WorkspaceRole } from "@form-builder/db";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "workspace";

export async function createPersonalWorkspace(user: { id: string; name?: string | null }) {
  const name = `${user.name?.trim() || "My"}'s workspace`;

  const slug = `${slugify(user.name ?? "workspace")}-${randomBytes(3).toString("hex")}`;

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({ data: { name, slug } });
    const membership = await tx.workspaceUser.create({
      data: { workspaceId: workspace.id, userId: user.id, role: WorkspaceRole.OWNER },
    });
    return membership;
  });
}
