import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { authClient } from "@/shared/lib/auth-client";
import { useMeQuery } from "@/services/auth/queries";
import { AuthLayout } from "./auth-layout";
import { authInputClass, getSafeRedirect, getVerifyCallbackURL, MIN_PASSWORD_LENGTH } from "./auth.utils";

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const redirect = getSafeRedirect(searchParams.get("redirect"));
  const meQuery = useMeQuery();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (meQuery.data) return <Navigate to={redirect} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    // Signs the user in right away; the API also emails a verification link
    const { error: signUpError } = await authClient.signUp.email({
      name: name.trim(),
      email,
      password,
      // Where the verification link sends them later
      callbackURL: getVerifyCallbackURL(redirect),
    });
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message ?? "Could not create your account");
      return;
    }
    // VerifyEmailReminder nudges them to verify from here on
    queryClient.clear();
    navigate(redirect, { replace: true });
  };

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
