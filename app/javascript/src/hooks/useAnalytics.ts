import { useCallback } from "react";
import { fetchAnalytics } from "../api/statistics";
import type { GroupBy } from "../types/statistics";
import { useApiData } from "./useApiData";

export const useAnalytics = (groupBy: GroupBy) => {
  const load = useCallback(
    (signal: AbortSignal) => fetchAnalytics(groupBy, signal),
    [groupBy],
  );
  const { data, error, retry } = useApiData(load);

  // Previous data is kept while refetching; only data for the requested grouping is returned,
  // so department names never reach countryName.
  return {
    data: data?.group_by === groupBy ? data : null,
    error,
    retry,
  };
};
