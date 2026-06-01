import { FormStatus, prisma, type Prisma } from "@form-builder/db";
import { NotFoundError } from "../errors/app-error.js";
import { randomBytes } from "node:crypto";

const createPublicToken = () => randomBytes(16).toString("base64url");

const verifyWorkspaceId = async (workspaceId: string) => {
    return await prisma.workspace.findUnique({ where: { id: workspaceId }});
}

const verifyFormId = async (formId: string) => {
    return await prisma.form.findUnique({ where: { id: formId }});
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

const getFormById = async (formId: string) => {
    const hasId = await verifyFormId(formId);
    if (!hasId) throw new NotFoundError("Form ID not found");
    const form = await prisma.form.findFirst({
        where: { id: formId, deletedAt: null }
    });

    if (!form) throw new NotFoundError("Form not found");

    const formVersion = await prisma.formVersion.findUnique({
        where: {
            formId_version: { formId: form.id, version: form.latestVersion }
        }
    });

    if (!formVersion) throw new NotFoundError("Form version not found");
    return { form, formVersion };
}

const updateForm = async (
    formId: string,
    formName: string,
    workspaceId: string,
    schema: Prisma.InputJsonValue
) => {
    const hasWorkspace = await verifyWorkspaceId(workspaceId);
    if (!hasWorkspace) throw new NotFoundError("Workspace not found");

    const existingForm = await prisma.form.findFirst({
        where: {
            id: formId,
            workspaceId: workspaceId,
            deletedAt: null
        }
    });

    if (!existingForm) throw new NotFoundError("Form not found");

    const currentFormVersion = await prisma.formVersion.findUnique({
        where: { formId_version: { formId, version: existingForm.latestVersion }}
    });

    if (!currentFormVersion) throw new NotFoundError("Form version not found");

    const submissionCount = await prisma.submission.count({
        where: { formVersionId: currentFormVersion.id }
    });

    const shouldUpdateInPlace = existingForm.status === FormStatus.DRAFT && submissionCount === 0;

    return prisma.$transaction(async (tx) => {
        if (shouldUpdateInPlace) {
            const form = await tx.form.update({
                where: { id: formId },
                data: { name: formName }
            });
            
            const formVersion = await tx.formVersion.update({
                where: {
                    formId_version: { formId, version: existingForm.latestVersion },
                },
                data: { schema }
            });

            return { form, formVersion, versionCreated: false }
            
        }

        const nextVersion = existingForm.latestVersion + 1;
        const form = await tx.form.update({
            where: { id: formId },
            data: { name: formName, latestVersion: nextVersion }
        });

        const formVersion = await tx.formVersion.create({
            data: { formId, schema, version: nextVersion }
        });
        return { form, formVersion, versionCreated: true };
    })
};

const listForms = async (workspaceId: string) => {
    const hasWorkspace = await verifyWorkspaceId(workspaceId);
    if (!hasWorkspace) throw new NotFoundError("Workspace not found");

    return prisma.form.findMany({
        where: {
            workspaceId,
            deletedAt: null,
        },
        orderBy: { updatedAt: "desc" },
        select: {
            id: true,
            name: true,
            description: true,
            status: true,
            latestVersion: true,
            publicToken: true,
            publishedVersion: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: { submissions: true },
            },
        },
    });
};

const publishForm = async (formId: string) => {
    const form = await prisma.form.findFirst({
        where: { id: formId, deletedAt: null }
    });

    if (!form) throw new NotFoundError("Form is not found");

    const version = await prisma.formVersion.findUnique({
        where: { formId_version: { formId, version: form.latestVersion }  }
    })

    if (!version) throw new NotFoundError("Form version not found");

    const publicToken = form.publicToken ?? createPublicToken();
    const publishedVersion = form.latestVersion

    const updated = await prisma.form.update({
        where: { id: formId, deletedAt: null },
        data: {
            status: FormStatus.PUBLISHED,
            publicToken,
            publishedVersion
        }
    });

    return {
        form: updated,
        publicToken,
        publishedVersion
    }

}

const getPublicFormByToken = async (token: string) => {
    const form = await prisma.form.findFirst({
        where: {
            publicToken: token,
            deletedAt: null,
            status: FormStatus.PUBLISHED,
        },
    });

    if (!form || form.publishedVersion == null) {
        throw new NotFoundError("Published form not found");
    }

    const formVersion = await prisma.formVersion.findUnique({
        where: {
            formId_version: { formId: form.id, version: form.publishedVersion },
        },
    });

    if (!formVersion) throw new NotFoundError("Form version not found");

    return {
        formId: form.id,
        name: form.name,
        description: form.description,
        publishedVersion: form.publishedVersion,
        schema: formVersion.schema,
    };
};

export default {
    createForm,
    getFormById,
    updateForm,
    listForms,
    publishForm,
    getPublicFormByToken,
};