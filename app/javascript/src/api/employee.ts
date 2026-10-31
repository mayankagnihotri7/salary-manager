import type {
  Department,
  EmployeeQuery,
  EmployeesResponse,
} from "../types/employee";
import { client } from "./client";

const toParams = (query: EmployeeQuery) =>
  Object.fromEntries(Object.entries(query).filter(([, value]) => value !== ""));

export const fetchEmployees = async (
  query: EmployeeQuery,
  signal?: AbortSignal,
): Promise<EmployeesResponse> => {
  const { data } = await client.get<EmployeesResponse>("/employees", {
    params: toParams(query),
    signal,
  });
  return data;
};

export const fetchDepartments = async (
  signal?: AbortSignal,
): Promise<Department[]> => {
  const { data } = await client.get<{ departments: Department[] }>(
    "/departments",
    { signal },
  );
  return data.departments;
};
