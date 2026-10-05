import { IntegrationProvider, prisma } from "@form-builder/db";
import { BadRequestError, NotFoundError } from "../errors/app-error";
import { NANGO_PROVIDER_CONFIG_KEY, nango } from "../lib/nango";


const verifyWorkspaceId = async (workspaceId: string) => {
    return prisma?.workspace.findUnique({ where: { id: workspaceId }});
}

export const createConnectSession = async (workspaceId: string, provider: string) => {
    const workspace = await verifyWorkspaceId(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace not found");

    if (provider !== "SLACK") {
        throw new BadRequestError("Only Slack is supported right now");
    }

    const { data } = await nango.createConnectSession({
        allowed_integrations: [NANGO_PROVIDER_CONFIG_KEY.SLACK],
        tags: {
            organization_id: workspaceId
        }
    });

    return {
        connectLink: data.connect_link,
        expiresAt: data.expires_at
    }
}

export const listConnections = async (workspaceId: string) => {
    const workspace = await verifyWorkspaceId(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace not found");

    return prisma?.integrationConnection.findMany({
        where: { workspaceId, isActive: true },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            provider: true,
            name: true,
            externalAccountId: true,
            isActive: true,
            createdAt: true,
        }
    })
}

export const upsertFromNangoAuth = async (input: {
    workspaceId: string;
    connectionId: string;
    providerConfigKey: string;
}) => {
    if (input.providerConfigKey !== NANGO_PROVIDER_CONFIG_KEY.SLACK) {
        return null;
    }

    const workspace = await verifyWorkspaceId(input.workspaceId);
    if (!workspace) throw new NotFoundError("Workspace not found");

    const existing = await prisma?.integrationConnection.findFirst({
        where: { externalAccountId: input.connectionId }
    });

    const data = {
        workspaceId: input.workspaceId,
        provider: IntegrationProvider.SLACK,
        name: 'Slack',
        externalAccountId: input.connectionId,
        config: { providerConfigKey: input.providerConfigKey },
        isActive: true,
    }

    if (existing) {
        return prisma?.integrationConnection.update({
            where: { id: existing.id },
            data
        })
    }

    return prisma?.integrationConnection.create({ data });
}

export const deactivateByConnectionId = async (connectionId: string) => {
    const existing = await prisma?.integrationConnection?.findFirst({
        where: { externalAccountId: connectionId }
    });

    if (!existing) return null;

    return prisma?.integrationConnection.update({
        where: { id: existing.id },
        data: { isActive: false }
    })
}