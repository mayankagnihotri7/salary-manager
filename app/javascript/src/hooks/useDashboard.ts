import { useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { fetchDashboard } from "../api/statistics";
import type { DashboardResponse } from "../types/statistics";
import { useSession } from "./useSession";

export const useDashboard = () => {
  const { expire } = useSession();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);

    const load = async () => {
      try {
        const loaded = await fetchDashboard(controller.signal);
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
  }, [attempt, expire]);

  const retry = () => setAttempt((current) => current + 1);

  return { data, error, retry };
};
