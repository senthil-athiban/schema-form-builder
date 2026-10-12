import { useEffect, useMemo } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { getWorkspaceId } from "@/shared/api";
import type { SlackNodeConfig } from "@/shared/api/types";
import { useIntegrationsListQuery, useSlackChannelsQuery } from "@/services/integrations/queries";
import { SlackConnect } from "@/form-builder/components/slack-connect.component";
import { useWorkflowEditorStore } from "../../store/workflow-editor-store";
import type { WorkflowCanvasNode } from "../../types";

const MESSAGE_MAX_LENGTH = 2000; // matches slackNodeConfigSchema on the API

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400";

interface SlackNodePanelProps {
  node: WorkflowCanvasNode;
}

export const SlackNodePanel: React.FC<SlackNodePanelProps> = ({ node }) => {
  const workspaceId = useMemo(() => getWorkspaceId(), []);
  const updateNodeConfig = useWorkflowEditorStore((s) => s.updateNodeConfig);
  const config = node.data.config as Partial<SlackNodeConfig>;

  const integrationsQuery = useIntegrationsListQuery(workspaceId);
  const connections = useMemo(
    () => (integrationsQuery.data ?? []).filter((c) => c.provider === "SLACK" && c.isActive),
    [integrationsQuery.data],
  );

  const channelsQuery = useSlackChannelsQuery(workspaceId, config.connectionId);
  const channels = channelsQuery.data ?? [];
  const selectedChannel = channels.find((c) => c.id === config.channelId);
  const isUnknownChannel = Boolean(config.channelId) && channelsQuery.isSuccess && !selectedChannel;

  useEffect(() => {
    if (!config.connectionId && connections.length === 1) {
      updateNodeConfig(node.id, { connectionId: connections[0]!.id });
    }
  }, [config.connectionId, connections, node.id, updateNodeConfig]);

  const handleConnectionChange = (connectionId: string) => {
    updateNodeConfig(node.id, {
      connectionId: connectionId || undefined,
      channelId: undefined,
      channelName: undefined,
    });
  };

  const handleChannelChange = (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId);
    updateNodeConfig(node.id, {
      channelId: channelId || undefined,
      channelName: channel?.name,
    });
  };

  if (integrationsQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 size={14} className="animate-spin" />
        Loading Slack connections…
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm text-slate-600">Connect a Slack workspace to post messages.</p>
        <SlackConnect />
        <p className="text-xs text-slate-500">After approving in the new tab, come back here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Slack connection</span>
        <select
          value={config.connectionId ?? ""}
          onChange={(e) => handleConnectionChange(e.target.value)}
          className={fieldClass}
        >
          <option value="">Select a connection…</option>
          {connections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name ?? "Slack"} · connected {new Date(c.createdAt).toLocaleDateString()}
            </option>
          ))}
        </select>
      </label>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">Channel</span>
          {config.connectionId && (
            <button
              type="button"
              onClick={() => void channelsQuery.refetch()}
              disabled={channelsQuery.isFetching}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
            >
              <RefreshCw size={12} className={channelsQuery.isFetching ? "animate-spin" : undefined} />
              Refresh
            </button>
          )}
        </div>

        <select
          value={config.channelId ?? ""}
          onChange={(e) => handleChannelChange(e.target.value)}
          disabled={!config.connectionId || channelsQuery.isLoading || channelsQuery.isError}
          className={fieldClass}
        >
          <option value="">
            {!config.connectionId
              ? "Pick a connection first"
              : channelsQuery.isLoading
                ? "Loading channels…"
                : "Select a channel…"}
          </option>
          {isUnknownChannel && (
            <option value={config.channelId}>
              {config.channelName ? `#${config.channelName}` : config.channelId} (not found)
            </option>
          )}
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.name}
              {c.isPrivate ? " (private)" : ""}
            </option>
          ))}
        </select>

        {channelsQuery.isError && (
          <p className="mt-1.5 text-xs text-red-600">{channelsQuery.error.message}</p>
        )}
        {isUnknownChannel && (
          <p className="mt-1.5 text-xs text-amber-600">
            The saved channel isn't visible to this connection. Pick another one.
          </p>
        )}
        {selectedChannel && !selectedChannel.isMember && (
          <p className="mt-1.5 flex gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
            <AlertTriangle size={14} className="mt-px shrink-0" />
            <span>
              The app isn't in #{selectedChannel.name}. Invite it there in Slack (
              <code>/invite @app-name</code>), or messages will fail with <code>not_in_channel</code>.
            </span>
          </p>
        )}
      </div>

      <label className="block">
        <span className="text-xs font-medium text-slate-600">Message (optional)</span>
        <textarea
          value={config.message ?? ""}
          onChange={(e) => updateNodeConfig(node.id, { message: e.target.value || undefined })}
          maxLength={MESSAGE_MAX_LENGTH}
          rows={4}
          placeholder="New lead from the contact form!"
          className={fieldClass}
        />
        <span className="mt-1 block text-xs text-slate-400">Sent above the submission details.</span>
      </label>
    </div>
  );
};
