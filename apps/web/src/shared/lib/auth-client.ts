import { createAuthClient } from "better-auth/react";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api/v1";

export const authClient = createAuthClient({
  baseURL: new URL(apiBase).origin,
  fetchOptions: { credentials: "include" },
});
