import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2, Workflow } from "lucide-react";
import { getWorkspaceId } from "@/shared/api";
import { useFormByIdQuery } from "@/services/forms/queries";
import { useWorkflowsListQuery } from "@/services/workflows/queries";
import {
  useCreateWorkflowMutation,
  useDeleteWorkflowMutation,
} from "@/services/workflows/mutations";

export const WorkflowsList: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const workspaceId = useMemo(() => getWorkspaceId(), []);

  const formQuery = useFormByIdQuery(formId);
  const workflowsQuery = useWorkflowsListQuery(workspaceId, formId);
  const createMutation = useCreateWorkflowMutation(workspaceId);
  const deleteMutation = useDeleteWorkflowMutation(workspaceId);

  const formName = formQuery.data?.form.name ?? "Form";
  const workflows = workflowsQuery.data ?? [];

  const handleCreate = async () => {
    if (!formId) return;
    try {
      const workflow = await createMutation.mutateAsync({
        formId,
        name: `${formName} workflow`,
      });
      navigate(`/forms/${formId}/workflows/${workflow.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create workflow");
    }
  };

  const handleDelete = async (workflowId: string, name: string) => {
    if (!formId) return;
    if (!confirm(`Delete workflow "${name}"? It will stop running.`)) return;
    try {
      await deleteMutation.mutateAsync({ workflowId, formId });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete workflow");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/forms"
              className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft size={14} />
              All forms
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Workflows</h1>
            <p className="mt-1 text-sm text-slate-500">
              What happens when someone submits <span className="font-medium">{formName}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={createMutation.isPending || !formId}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {createMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            New workflow
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {workflowsQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading workflows…
          </div>
        ) : workflowsQuery.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {workflowsQuery.error.message}
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <Workflow size={40} className="text-slate-300" />
            <p className="mt-4 text-lg font-medium text-slate-800">No workflows yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Send submissions to Slack or a webhook automatically.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {workflows.map((wf) => {
              const actionCount = Math.max(wf._count.nodes - 1, 0); // minus the trigger
              return (
                <li key={wf.id} className="flex items-center gap-2 px-2 py-1 sm:gap-4 sm:px-3">
                  <Link
                    to={`/forms/${formId}/workflows/${wf.id}`}
                    className="flex min-w-0 flex-1 items-center gap-4 rounded-lg px-2 py-3 transition hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Workflow size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-slate-900">{wf.name}</span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            wf.isActive
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-slate-50 text-slate-500 ring-slate-200"
                          }`}
                        >
                          {wf.isActive ? "Active" : "Off"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {actionCount} action{actionCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete(wf.id, wf.name)}
                    disabled={deleteMutation.isPending}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    aria-label={`Delete ${wf.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};
