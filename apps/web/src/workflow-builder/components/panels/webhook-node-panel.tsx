import type { WebhookMethod, WebhookNodeConfig } from "@/shared/api/types";
import { useWorkflowEditorStore } from "../../store/workflow-editor-store";
import type { WorkflowCanvasNode } from "../../types";

const METHODS: WebhookMethod[] = ["POST", "PUT", "GET"];

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none";

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

interface WebhookNodePanelProps {
  node: WorkflowCanvasNode;
}

export const WebhookNodePanel: React.FC<WebhookNodePanelProps> = ({ node }) => {
  const updateNodeConfig = useWorkflowEditorStore((s) => s.updateNodeConfig);
  const config = node.data.config as Partial<WebhookNodeConfig>;
  const method = config.method ?? "POST";
  const showUrlError = Boolean(config.url) && !isValidUrl(config.url!);

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs font-medium text-slate-600">URL</span>
        <input
          type="url"
          value={config.url ?? ""}
          onChange={(e) => updateNodeConfig(node.id, { url: e.target.value.trim() || undefined })}
          placeholder="https://example.com/webhooks/forms"
          className={`${fieldClass} ${showUrlError ? "border-red-300" : ""}`}
        />
        {showUrlError && (
          <span className="mt-1 block text-xs text-red-600">Enter a full http(s) URL.</span>
        )}
      </label>

      <label className="block">
        <span className="text-xs font-medium text-slate-600">Method</span>
        <select
          value={method}
          onChange={(e) => updateNodeConfig(node.id, { method: e.target.value as WebhookMethod })}
          className={fieldClass}
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-slate-400">
          {method === "GET"
            ? "GET requests send no body, only the URL is called."
            : "The submission is sent as JSON in the request body."}
        </span>
      </label>
    </div>
  );
};
