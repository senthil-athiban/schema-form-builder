import { nango } from "../lib/nango";

export type SlackConfig = {
    channel: string;
}

export const executeSlackMessage = async (connectionId: string, channel: string, text: string) => {
    const res = await nango.post({
        endpoint: '/chat.postMessage',
        providerConfigKey: 'slack',
        connectionId,
        data: { channel, text }
    });

    return res.data;
};

export const parseSlackConfig = (config: unknown) : SlackConfig => {
    if (!config || typeof config !== "object" || Array.isArray(config)) {
        throw new Error("Slack node config must be an object");
    }

    const raw = config as Record<string, unknown>;
    const channelFromConfig = typeof raw.channel === "string" ? raw.channel : undefined;

    const channel = channelFromConfig || process.env.SLACK_CHANNEL_ID;
    if (!channel) {
        throw new Error("Slack channel is missing (node config.channel or SLACK_CHANNEL_ID)");
    }
    return { channel };
}