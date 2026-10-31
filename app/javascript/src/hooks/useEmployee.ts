import { useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { fetchEmployee } from "../api/employee";
import type { Employee } from "../types/employee";
import { useSession } from "./useSession";

export const useEmployee = (id: string) => {
  const { expire } = useSession();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setEmployee(null);
    setError(null);
    setNotFound(false);

    const load = async () => {
      try {
        const loaded = await fetchEmployee(id, controller.signal);
        if (!controller.signal.aborted) {
          setEmployee(loaded);
        }
      } catch (caught) {
        if (controller.signal.aborted) return;

        if (caught instanceof ApiError && caught.status === 401) {
          expire();
          return;
        }
        if (caught instanceof ApiError && caught.status === 404) {
          setNotFound(true);
          return;
        }
        setError(
          caught instanceof ApiError ? caught.message : "Something went wrong.",
        );
      }
    };

    void load();

    return () => controller.abort();
  }, [id, attempt, expire]);

  const retry = () => setAttempt((current) => current + 1);

  return { employee, setEmployee, error, notFound, retry };
};
