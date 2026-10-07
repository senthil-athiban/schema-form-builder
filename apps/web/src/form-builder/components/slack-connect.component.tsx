import { useMemo } from "react";
import { CheckCircle2, Loader2, Radio } from "lucide-react";
import { getWorkspaceId } from "@/shared/api";
import { useIntegrationsListQuery } from "@/services/integrations/queries";
import { useCreateSlackConnectSessionMutation } from "@/services/integrations/mutations";

export const SlackConnect: React.FC = () => {
  const workspaceId = useMemo(() => getWorkspaceId(), []);
  const integrationsQuery = useIntegrationsListQuery(workspaceId);
  const connectMutation = useCreateSlackConnectSessionMutation(workspaceId);

  const slackConnection = (integrationsQuery.data ?? []).find(
    (c) => c.provider === "SLACK" && c.isActive,
  );
  const isConnected = Boolean(slackConnection);
  const isBusy =
    integrationsQuery.isLoading || connectMutation.isPending;

  const handleConnect = async () => {
    try {
      const { connectLink } = await connectMutation.mutateAsync();
      window.open(connectLink, "_blank", "noopener,noreferrer");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start Slack connect";
      alert(message);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={16} />
          Slack connected
        </span>
      ) : (
        <button
          type="button"
          onClick={() => void handleConnect()}
          disabled={isBusy}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {connectMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Radio size={16} />
          )}
          Connect Slack
        </button>
      )}
    </div>
  );
};