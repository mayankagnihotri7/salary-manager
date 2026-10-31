import { Link, useLocation } from "react-router";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  type EmployeeSort,
} from "../../constants/employees";
import { countryName, formatDate, formatSalary } from "../../lib/format";
import type { Employee, SortDirection } from "../../types/employee";

type Column = {
  sort: EmployeeSort;
  label: string;
  alignRight?: boolean;
  hint?: string;
};

const COLUMNS: Column[] = [
  { sort: "employee_number", label: "Employee #" },
  { sort: "name", label: "Name" },
  { sort: "job_title", label: "Job title" },
  { sort: "department", label: "Department" },
  { sort: "country_code", label: "Country" },
  { sort: "currency", label: "Currency" },
  {
    sort: "salary",
    label: "Salary",
    alignRight: true,
    hint: "Sorted by currency, then amount",
  },
  { sort: "hired_on", label: "Hired" },
  { sort: "status", label: "Status" },
];

type Props = {
  employees: Employee[];
  sort: EmployeeSort;
  dir: SortDirection;
  isFetching: boolean;
  onSort: (sort: EmployeeSort) => void;
};

export const EmployeeTable = ({
  employees,
  sort,
  dir,
  isFetching,
  onSort,
}: Props) => {
  const { search } = useLocation();

  return (
    <div
      className={`overflow-x-auto rounded-lg border border-slate-200 bg-white transition-opacity ${
        isFetching ? "opacity-60 delay-200" : ""
      }`}
    >
      <table
        className='min-w-full divide-y divide-slate-200 text-sm'
        aria-busy={isFetching}
      >
        <caption className='sr-only'>Employees</caption>
        <thead className='bg-slate-50'>
          <tr>
            {COLUMNS.map((column) => {
              const isSorted = column.sort === sort;
  
              return (
                <th
                  key={column.sort}
                  scope='col'
                  aria-sort={
                    isSorted
                      ? dir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className={`px-3 py-2 font-medium text-slate-600 ${column.alignRight ? "text-right" : "text-left"}`}
                >
                  <button
                    type='button'
                    onClick={() => onSort(column.sort)}
                    title={column.hint}
                    className='inline-flex items-center gap-1 hover:text-slate-900'
                  >
                    {column.label}
                    <span aria-hidden='true'>
                      {isSorted ? (dir === "asc" ? "▲" : "▼") : ""}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className='divide-y divide-slate-100'>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td className='whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-600'>
                {employee.employee_number}
              </td>
              <td className='px-3 py-2'>
                <Link
                  to={`/employees/${employee.id}`}
                  state={{ directorySearch: search }}
                  className='font-medium text-slate-900 hover:underline'
                >
                  {employee.first_name} {employee.last_name}
                </Link>
                <div className='text-xs text-slate-500'>{employee.email}</div>
              </td>
              <td className='px-3 py-2'>{employee.job_title}</td>
              <td className='px-3 py-2'>{employee.department.name}</td>
              <td className='px-3 py-2'>{countryName(employee.country_code)}</td>
              <td className='px-3 py-2'>{employee.currency}</td>
              <td className='whitespace-nowrap px-3 py-2 text-right tabular-nums'>
                {formatSalary(employee.salary, employee.currency)}
              </td>
              <td className='whitespace-nowrap px-3 py-2'>
                {formatDate(employee.hired_on)}
              </td>
              <td className='px-3 py-2'>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[employee.status]}`}
                >
                  {STATUS_LABELS[employee.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
