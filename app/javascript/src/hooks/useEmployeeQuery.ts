import { useMemo } from "react";
import { useSearchParams } from "react-router";
import {
  DEFAULT_PER_PAGE,
  PER_PAGE_OPTIONS,
  SORTS,
} from "../constants/employees";
import type { EmployeeQuery, UpdateEmployeeQuery } from "../types/employee";

const DEFAULT_QUERY: EmployeeQuery = {
  q: "",
  department_id: "",
  country_code: "",
  currency: "",
  status: "",
  sort: "employee_number",
  dir: "asc",
  page: 1,
  per_page: DEFAULT_PER_PAGE,
};

const QUERY_KEYS = Object.keys(DEFAULT_QUERY) as (keyof EmployeeQuery)[];

const parseQuery = (params: URLSearchParams): EmployeeQuery => {
  const page = Number.parseInt(params.get("page") ?? "", 10);
  const perPage = Number.parseInt(params.get("per_page") ?? "", 10);

  return {
    q: (params.get("q") ?? "").trim(),
    department_id: params.get("department_id") ?? "",
    country_code: (params.get("country_code") ?? "").trim().toUpperCase(),
    currency: (params.get("currency") ?? "").trim().toUpperCase(),
    status: params.get("status") ?? "",
    sort:
      SORTS.find((sort) => sort === params.get("sort")) ?? DEFAULT_QUERY.sort,
    dir: params.get("dir")?.toLowerCase() === "desc" ? "desc" : "asc",
    page: page > 0 ? page : 1,
    per_page:
      PER_PAGE_OPTIONS.find((option) => option === perPage) ?? DEFAULT_PER_PAGE,
  };
};

const serializeQuery = (query: EmployeeQuery): URLSearchParams => {
  const params = new URLSearchParams();
  for (const key of QUERY_KEYS) {
    if (query[key] !== DEFAULT_QUERY[key]) {
      params.set(key, String(query[key]));
    }
  }
  return params;
};

export const useEmployeeQuery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => parseQuery(searchParams), [searchParams]);

  const updateQuery: UpdateEmployeeQuery = (changes, options) => {
    setSearchParams(
      (current) =>
        serializeQuery({
          ...parseQuery(current),
          ...changes,
          page: changes.page ?? 1,
        }),
      { replace: options?.replace ?? false },
    );
  };

  const clearFilters = () => {
    updateQuery({
      q: "",
      department_id: "",
      country_code: "",
      currency: "",
      status: "",
    });
  };

  const hasActiveFilters = Boolean(
    query.q ||
    query.department_id ||
    query.country_code ||
    query.currency ||
    query.status,
  );

  return { query, updateQuery, clearFilters, hasActiveFilters };
};
