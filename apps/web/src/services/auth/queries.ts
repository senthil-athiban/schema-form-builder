import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/client";
import { meApi } from "@/shared/api/me.api";

export const meQueryKey = ["me"] as const;

export function useMeQuery() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: () => meApi.get(),
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 401) && failureCount < 2,
    staleTime: 5 * 60_000,
  });
}
