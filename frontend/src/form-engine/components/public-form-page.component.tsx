import { useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { FormRenderer } from "./form-renderer";
import { usePublicFormByTokenQuery } from "@/services/public-forms/queries";
import { useSubmitPublicFormMutation } from "@/services/public-forms/mutations";
import { ApiError } from "@/shared/api/client";

export const PublicFormPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const publicFormQuery = usePublicFormByTokenQuery(token);
  const submitMutation = useSubmitPublicFormMutation();
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

  const successMessage =
    schema.settings.notifications?.success ??
    "Thank you! Your response has been submitted.";

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-emerald-200 bg-white px-8 py-10 text-center shadow-sm">
          <CheckCircle2
            className="mx-auto mb-4 text-emerald-600"
            size={48}
            aria-hidden
          />
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-4 text-slate-600">{successMessage}</p>
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

        {submitError ? (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-red-700"
            role="alert"
          >
            {submitError}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <FormRenderer
            schema={schema}
            onSubmit={async (data) => {
              if (!token) {
                setSubmitError("Invalid form link");
                return;
              }

              setSubmitError(null);

              try {
                await submitMutation.mutateAsync({ token, responseData: data });
                setSubmitted(true);
              } catch (err) {
                const message =
                  err instanceof ApiError
                    ? err.message
                    : schema.settings.notifications?.error ??
                      "Failed to submit your response. Please try again.";
                setSubmitError(message);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
