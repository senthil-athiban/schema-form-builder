import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { authClient } from "@/shared/lib/auth-client";
import { useMeQuery } from "@/services/auth/queries";
import { AuthLayout } from "./auth-layout";
import { authInputClass, getSafeRedirect, getVerifyCallbackURL } from "./auth.utils";
import { ResendVerification } from "./resend-verification";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const redirect = getSafeRedirect(searchParams.get("redirect"));
  const linkError = searchParams.get("error");
  const meQuery = useMeQuery();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (meQuery.data) return <Navigate to={redirect} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    setSubmitting(true);
    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      // Used by the fresh verification email that sign-in sends to unverified users
      callbackURL: getVerifyCallbackURL(redirect),
    });
    setSubmitting(false);

    if (signInError) {
      // 403 = right password, email not verified yet (a new link was just sent)
      if (signInError.status === 403) {
        setUnverifiedEmail(email);
        return;
      }
      setError(signInError.message ?? "Invalid email or password");
      return;
    }
    queryClient.clear();
    navigate(redirect, { replace: true });
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your forms">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </label>

        {linkError && !error && !unverifiedEmail && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            That verification link is invalid or has expired. Sign in to get a new one.
          </p>
        )}
        {unverifiedEmail && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Please verify your email first. We just sent a new link to {unverifiedEmail}.
            <ResendVerification email={unverifiedEmail} redirect={redirect} />
          </div>
        )}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Sign in
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        No account?{" "}
        <Link
          to={`/signup?redirect=${encodeURIComponent(redirect)}`}
          className="font-medium text-indigo-600 hover:underline"
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
};
