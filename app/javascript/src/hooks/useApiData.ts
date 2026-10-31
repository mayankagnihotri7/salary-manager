import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { useSession } from "./useSession";

type LoadError = { message: string; status?: number };

// Loads data whenever `load` changes; callers pass a stable function (module-level or useCallback).
// The previous data is kept while refetching and after a failure, and a superseded request is
// aborted so its response can never overwrite a newer one. A 401 ends the session.
export const useApiData = <T>(load: (signal: AbortSignal) => Promise<T>) => {
  const { expire } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<LoadError | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsFetching(true);
    setError(null);

    const run = async () => {
      try {
        const loaded = await load(controller.signal);
        if (!controller.signal.aborted) {
          setData(loaded);
        }
      } catch (caught) {
        if (controller.signal.aborted) return;

        if (caught instanceof ApiError && caught.status === 401) {
          expire();
          return;
        }
        // ApiError messages are fixed client-side strings, never server-provided text.
        setError(
          caught instanceof ApiError
            ? { message: caught.message, status: caught.status }
            : { message: "Something went wrong." },
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsFetching(false);
        }
      }
    };

    void run();

    return () => controller.abort();
  }, [load, attempt, expire]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  return {
    data,
    setData,
    error: error?.message ?? null,
    errorStatus: error?.status ?? null,
    isFetching,
    retry,
  };
};
