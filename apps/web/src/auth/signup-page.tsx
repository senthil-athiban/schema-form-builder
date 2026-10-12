import { useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { authClient } from "@/shared/lib/auth-client";
import { useMeQuery } from "@/services/auth/queries";
import { AuthLayout } from "./auth-layout";
import { authInputClass, getSafeRedirect, getVerifyCallbackURL, MIN_PASSWORD_LENGTH } from "./auth.utils";
import { ResendVerification } from "./resend-verification";

export const SignupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const redirect = getSafeRedirect(searchParams.get("redirect"));
  const meQuery = useMeQuery();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Set after sign-up: the account exists but stays signed out until the email link is clicked
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (meQuery.data) return <Navigate to={redirect} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    // The API creates the user + workspace and emails a verification link (no session yet)
    const { error: signUpError } = await authClient.signUp.email({
      name: name.trim(),
      email,
      password,
      callbackURL: getVerifyCallbackURL(redirect),
    });
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message ?? "Could not create your account");
      return;
    }
    setSentTo(email);
  };

  if (sentTo) {
    return (
      <AuthLayout title="Check your inbox" subtitle="One more step to activate your account">
        <div className="flex flex-col items-center text-center">
          <MailCheck size={36} className="text-indigo-600" aria-hidden />
          <p className="mt-3 text-sm text-slate-600">
            We sent a verification link to <span className="font-medium text-slate-900">{sentTo}</span>. Click it to
            sign in. The link expires in 1 hour.
          </p>
          <ResendVerification email={sentTo} redirect={redirect} />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="You'll get your own workspace for forms and responses">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={authInputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
          <span className="mt-1 block text-xs text-slate-400">At least {MIN_PASSWORD_LENGTH} characters</span>
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Create account
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          to={`/login?redirect=${encodeURIComponent(redirect)}`}
          className="font-medium text-indigo-600 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};
