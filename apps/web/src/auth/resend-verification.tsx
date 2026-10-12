import { useState } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/shared/lib/auth-client";
import { getVerifyCallbackURL } from "./auth.utils";

interface ResendVerificationProps {
  email: string;
  redirect: string;
}

export const ResendVerification: React.FC<ResendVerificationProps> = ({ email, redirect }) => {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const handleResend = async () => {
    setState("sending");
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: getVerifyCallbackURL(redirect),
    });
    setState(error ? "failed" : "sent");
  };

  if (state === "sent") {
    return <p className="mt-3 text-sm text-slate-500">A new link is on its way.</p>;
  }

  return (
    <p className="mt-3 text-sm text-slate-500">
      {state === "failed" ? "Couldn't send it, please try again. " : "Didn't get it? "}
      <button
        type="button"
        onClick={() => void handleResend()}
        disabled={state === "sending"}
        className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline disabled:opacity-60"
      >
        {state === "sending" && <Loader2 size={13} className="animate-spin" />}
        Resend email
      </button>
    </p>
  );
};
