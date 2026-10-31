import { ErrorAlert } from "../components/ErrorAlert";
import { EmployeeFilters } from "../components/employees/EmployeeFilters";
import { EmployeeTable } from "../components/employees/EmployeeTable";
import { Pagination } from "../components/employees/Pagination";
import type { EmployeeSort } from "../constants/employees";
import { useDepartments } from "../hooks/useDepartments";
import { useEmployeeQuery } from "../hooks/useEmployeeQuery";
import { useEmployees } from "../hooks/useEmployees";
import { formatCount } from "../lib/format";
import type { EmployeesResponse } from "../types/employee";

export const EmployeePage = () => {
  const { query, updateQuery, clearFilters, hasActiveFilters } =
    useEmployeeQuery();
  const { data, error, isFetching, retry } = useEmployees(query);
  const { departments, status: departmentsStatus } = useDepartments();

  // Clicking the active column toggles the direction; a new column starts ascending.
  const handleSort = (sort: EmployeeSort) => {
    updateQuery(
      query.sort === sort
        ? { dir: query.dir === "asc" ? "desc" : "asc" }
        : { sort, dir: "asc" },
    );
  };

  const renderResults = ({ employees, meta }: EmployeesResponse) => {
    if (employees.length === 0) {
      return (
        <div className='rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-600'>
          {meta.total_count > 0 ? (
            <>
              <p>This page is out of range.</p>
              <button
                type='button'
                onClick={() => updateQuery({ page: 1 })}
                className='mt-3 rounded border border-slate-300 px-3 py-1 hover:bg-slate-100'
              >
                Go to the first page
              </button>
            </>
          ) : (
            <>
              <p>No employees match your search or filters.</p>
              {hasActiveFilters && (
                <button
                  type='button'
                  onClick={clearFilters}
                  className='mt-3 rounded border border-slate-300 px-3 py-1 hover:bg-slate-100'
                >
                  Clear filters
                </button>
              )}
            </>
          )}
        </div>
      );
    }

    return (
      <>
        <EmployeeTable
          employees={employees}
          sort={query.sort}
          dir={query.dir}
          isFetching={isFetching}
          onSort={handleSort}
        />
        <Pagination
          meta={meta}
          onPageChange={(page) => updateQuery({ page })}
          onPerPageChange={(perPage) => updateQuery({ per_page: perPage })}
        />
      </>
    );
  };

  return (
    <section aria-labelledby='employees-heading' className='space-y-4'>
      <h2
        id='employees-heading'
        className='text-xl font-semibold text-slate-900'
      >
        Employees
      </h2>

      <EmployeeFilters
        query={query}
        departments={departments}
        departmentsStatus={departmentsStatus}
        hasActiveFilters={hasActiveFilters}
        onChange={updateQuery}
        onClear={clearFilters}
      />

      {error && (
        <ErrorAlert
          message={data ? `${error} Showing the previous results.` : error}
          onRetry={retry}
        />
      )}

      {!data && !error && (
        <p role='status' className='text-slate-600'>
          Loading employees…
        </p>
      )}

      {data && (
        <>
          <p role='status' className='text-sm text-slate-600'>
            {formatCount(data.meta.total_count)}{" "}
            {data.meta.total_count === 1 ? "employee" : "employees"}
            <span
              aria-hidden='true'
              className={`transition-opacity ${isFetching ? "opacity-100 delay-200" : "opacity-0"}`}
            >
              {" · Updating…"}
            </span>
            {isFetching && <span className='sr-only'> Updating results</span>}
          </p>
          {renderResults(data)}
        </>
      )}
    </section>
  );
};
