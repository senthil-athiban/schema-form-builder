import { get } from "./client";
import type { ApiResponse, MeResult } from "./types";

export const meApi = {
  async get() {
    const result = await get<ApiResponse<MeResult>>("/me");
    return result.data.data;
  },
};
