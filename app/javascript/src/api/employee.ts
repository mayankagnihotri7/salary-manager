import type {
  Department,
  Employee,
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

export const fetchEmployee = async (
  id: string,
  signal?: AbortSignal,
): Promise<Employee> => {
  const { data } = await client.get<{ employee: Employee }>(
    `/employees/${id}`,
    { signal },
  );
  return data.employee;
};

// The salary is sent as the raw string so the server validates exactly what was typed.
export const updateEmployeeSalary = async (
  id: string,
  salary: string,
): Promise<Employee> => {
  const { data } = await client.patch<{ employee: Employee }>(
    `/employees/${id}`,
    { employee: { salary } },
  );
  return data.employee;
};
