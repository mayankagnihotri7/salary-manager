import { fetchDashboard } from "../api/statistics";
import { useApiData } from "./useApiData";

export const useDashboard = () => {
  const { data, error, retry } = useApiData(fetchDashboard);

  return { data, error, retry };
};
