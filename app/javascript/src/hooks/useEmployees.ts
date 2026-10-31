import { useCallback } from "react";
import { fetchEmployees } from "../api/employee";
import type { EmployeeQuery } from "../types/employee";
import { useApiData } from "./useApiData";

// `query` is memoized by useEmployeeQuery, so a new request starts only when the URL changes.
export const useEmployees = (query: EmployeeQuery) => {
  const load = useCallback(
    (signal: AbortSignal) => fetchEmployees(query, signal),
    [query],
  );
  const { data, error, isFetching, retry } = useApiData(load);

  return { data, error, isFetching, retry };
};
