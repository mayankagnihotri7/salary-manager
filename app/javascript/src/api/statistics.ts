import type {
  AnalyticsResponse,
  DashboardResponse,
  GroupBy,
} from "../types/statistics";
import { client } from "./client";

export const fetchDashboard = async (
  signal?: AbortSignal,
): Promise<DashboardResponse> => {
  const { data } = await client.get<DashboardResponse>("/dashboard", {
    signal,
  });
  return data;
};

export const fetchAnalytics = async (
  groupBy: GroupBy,
  signal?: AbortSignal,
): Promise<AnalyticsResponse> => {
  const { data } = await client.get<AnalyticsResponse>("/analytics", {
    params: { group_by: groupBy },
    signal,
  });
  return data;
};
