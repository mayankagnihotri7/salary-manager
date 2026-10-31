import { useEffect, useState } from "react";
import { ApiError } from "../api/client";
import type { EmployeeQuery, EmployeesResponse } from "../types/employee";
import { useSession } from "./useSession";
import { fetchEmployees } from "../api/employee";

export const useEmployees = (query: EmployeeQuery) => {
  const { expire } = useSession();
  const [data, setData] = useState<EmployeesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsFetching(true);
    setError(null);

    const load = async () => {
      try {
        const response = await fetchEmployees(query, controller.signal);
        if (!controller.signal.aborted) {
          setData(response);
        }
      } catch (caught) {
        // An aborted request belongs to a superseded query: ignore it entirely.
        if (controller.signal.aborted) return;

        if (caught instanceof ApiError && caught.status === 401) {
          expire();
          return;
        }
        // 403 and everything else: a fixed message, never server-provided text.
        setError(
          caught instanceof ApiError ? caught.message : "Something went wrong.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsFetching(false);
        }
      }
    };

    void load();

    return () => controller.abort();
  }, [query, attempt, expire]);

  const retry = () => setAttempt((current) => current + 1);

  return { data, error, isFetching, retry };
};
