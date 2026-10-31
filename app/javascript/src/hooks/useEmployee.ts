import { useCallback } from "react";
import { fetchEmployee } from "../api/employee";
import { useApiData } from "./useApiData";

export const useEmployee = (id: string) => {
  const load = useCallback(
    (signal: AbortSignal) => fetchEmployee(id, signal),
    [id],
  );
  const { data, setData, error, errorStatus, retry } = useApiData(load);
  const notFound = errorStatus === 404;

  return {
    // Previous data is kept while refetching; never show another employee's record.
    employee: data?.id === id ? data : null,
    setEmployee: setData,
    error: notFound ? null : error,
    notFound,
    retry,
  };
};
