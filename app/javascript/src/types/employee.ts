import type { EmployeeSort, EmployeeStatus } from "../constants/employees";

export type SortDirection = "asc" | "desc";

export type Employee = {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  department: { id: string; name: string };
  country_code: string;
  currency: string;
  salary: string;
  hired_on: string;
  status: EmployeeStatus;
};

export type Department = {
  id: string;
  name: string;
  employees_count: number;
};

export type PageMeta = {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
};

export type EmployeesResponse = {
  employees: Employee[];
  meta: PageMeta;
};

export type EmployeeQuery = {
  q: string;
  department_id: string;
  country_code: string;
  currency: string;
  status: string;
  sort: EmployeeSort;
  dir: SortDirection;
  page: number;
  per_page: number;
};

export type UpdateEmployeeQuery = (
  changes: Partial<EmployeeQuery>,
  options?: { replace?: boolean },
) => void;
