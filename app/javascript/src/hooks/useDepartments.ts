import { fetchDepartments } from "../api/employee";
import { useApiData } from "./useApiData";

export type DepartmentsStatus = "loading" | "ready" | "failed";

export const useDepartments = () => {
  const { data, error } = useApiData(fetchDepartments);
  const status: DepartmentsStatus = data
    ? "ready"
    : error
      ? "failed"
      : "loading";

  return { departments: data ?? [], status };
};
