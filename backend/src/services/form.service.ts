import { FormStatus, type Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { NotFoundError } from "../errors/app-error.js";

const verifyWorkspaceId = async (workspaceId: string) => {
    return await prisma.workspace.findUnique({ where: { id: workspaceId }});
}

const createForm = async (formName: string, workspaceId: string, schema: Prisma.InputJsonValue) => {
    const hasId = await verifyWorkspaceId(workspaceId);
    if (!hasId) throw new NotFoundError("Workspace not found");

    return await prisma.$transaction(async tx => {
        const form = await tx.form.create({
            data: {
                workspaceId,
                name: formName,
                status: FormStatus.DRAFT,
                latestVersion: 1
            }
        });

        const formVersion = await tx.formVersion.create({
            data: {
                formId: form.id,
                version: 1,
                schema
            }
        });

        return { form, formVersion };
    })
}

export default { createForm };