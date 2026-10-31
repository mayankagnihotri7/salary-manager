import { useEffect, useState } from "react";
import { ApiError } from "../api/client";
import type { Department } from "../types/employee";
import { useSession } from "./useSession";
import { fetchDepartments } from "../api/employee";

export type DepartmentsStatus = "loading" | "ready" | "failed";

export const useDepartments = () => {
  const { expire } = useSession();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [status, setStatus] = useState<DepartmentsStatus>("loading");

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const loaded = await fetchDepartments(controller.signal);
        if (!controller.signal.aborted) {
          setDepartments(loaded);
          setStatus("ready");
        }
      } catch (caught) {
        if (controller.signal.aborted) return;

        if (caught instanceof ApiError && caught.status === 401) {
          expire();
          return;
        }
        setStatus("failed");
      }
    };

    void load();

    return () => controller.abort();
  }, [expire]);

  return { departments, status };
};
