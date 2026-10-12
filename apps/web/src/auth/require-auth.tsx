import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ApiError, setCurrentWorkspaceId, UNAUTHORIZED_EVENT } from "@/shared/api/client";
import { meQueryKey, useMeQuery } from "@/services/auth/queries";

export const RequireAuth: React.FC = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const meQuery = useMeQuery();

  useEffect(() => {
    const onUnauthorized = () => void queryClient.invalidateQueries({ queryKey: meQueryKey });
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [queryClient]);

  if (meQuery.error instanceof ApiError && meQuery.error.status === 401) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (meQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-slate-50 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading…
      </div>
    );
  }

  if (meQuery.error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <p className="text-sm text-red-600">{meQuery.error.message}</p>
        <button
          type="button"
          onClick={() => void meQuery.refetch()}
          className="text-sm text-indigo-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  setCurrentWorkspaceId(meQuery.data.workspace.id);
  return (
    <>
      <Outlet />
    </>
  );
};
