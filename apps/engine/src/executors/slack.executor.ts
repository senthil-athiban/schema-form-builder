import { nango } from "../lib/nango";

export type SlackConfig = {
    connectionId?: string;
    channel: string;
    message?: string;
}

type SlackPostMessageResponse = {
    ok: boolean;
    error?: string;
    ts?: string;
    channel?: string;
}

export const executeSlackMessage = async (connectionId: string, channel: string, text: string) => {
    const res = await nango.post({
        endpoint: '/chat.postMessage',
        providerConfigKey: 'slack',
        connectionId,
        data: { channel, text }
    });

    // Slack answers HTTP 200 with ok:false on errors (not_in_channel, channel_not_found, ...)
    if (!res.data.ok) {
        throw new Error(`Slack error: ${res.data.error ?? "unknown"}`);
    }

    return res.data;
};

export const parseSlackConfig = (config: unknown) : SlackConfig => {
    if (!config || typeof config !== "object" || Array.isArray(config)) {
        throw new Error("Slack node config must be an object");
    }

    const raw = config as Record<string, unknown>;
    const str = (value: unknown) => (typeof value === "string" && value.trim() ? value : undefined);

    // channelId = new editor format, channel = legacy seed format
    const channel = str(raw.channelId) ?? str(raw.channel) ?? process.env.SLACK_CHANNEL_ID;
    if (!channel) {
        throw new Error("Slack channel is missing (node config.channelId or SLACK_CHANNEL_ID)");
    }

    return {
        channel,
        connectionId: str(raw.connectionId),
        message: str(raw.message),
    };
}