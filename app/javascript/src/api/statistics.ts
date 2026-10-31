import type { DashboardResponse } from "../types/statistics";
import { client } from "./client";

export const fetchDashboard = async (
  signal?: AbortSignal,
): Promise<DashboardResponse> => {
  const { data } = await client.get<DashboardResponse>("/dashboard", {
    signal,
  });
  return data;
};
