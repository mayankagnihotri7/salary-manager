import { useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { fetchAnalytics } from "../api/statistics";
import type { AnalyticsResponse, GroupBy } from "../types/statistics";
import { useSession } from "./useSession";

export const useAnalytics = (groupBy: GroupBy) => {
  const { expire } = useSession();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);

    const load = async () => {
      try {
        const loaded = await fetchAnalytics(groupBy, controller.signal);
        if (!controller.signal.aborted) {
          setData(loaded);
        }
      } catch (caught) {
        if (controller.signal.aborted) return;

        if (caught instanceof ApiError && caught.status === 401) {
          expire();
          return;
        }
        setError(
          caught instanceof ApiError ? caught.message : "Something went wrong.",
        );
      }
    };

    void load();

    return () => controller.abort();
  }, [groupBy, attempt, expire]);

  const retry = () => setAttempt((current) => current + 1);

  // The first render after a grouping change still holds the previous response; only data
  // for the requested grouping is returned, so department names never reach countryName.
  return {
    data: data?.group_by === groupBy ? data : null,
    error,
    retry,
  };
};
