import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { FormRenderer } from "./form-renderer";
import { usePublicFormByTokenQuery } from "@/services/public-forms/queries";

export const PublicFormPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const publicFormQuery = usePublicFormByTokenQuery(token);
  const isLoading = publicFormQuery.isLoading;
  const schema = publicFormQuery.data?.schema ?? null;
  const title = publicFormQuery.data?.name ?? "";
  const description = publicFormQuery.data?.description ?? null;
  const error = token
    ? publicFormQuery.error instanceof Error
      ? publicFormQuery.error.message
      : publicFormQuery.error
        ? "Failed to load form"
        : null
    : "Invalid form link";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="mr-2 animate-spin" size={20} />
        Loading form…
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-center text-red-700">
          {error ?? "Form not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          {description ? (
            <p className="mt-2 text-slate-600">{description}</p>
          ) : null}
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <FormRenderer
            schema={schema}
            onSubmit={async (data) => {
              console.log("Public form submit (part ii):", data);
              alert("Submission will be wired in the next step.");
            }}
          />
        </div>
      </div>
    </div>
  );
};
