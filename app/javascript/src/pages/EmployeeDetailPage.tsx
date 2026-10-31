import { Link, useLocation, useParams } from "react-router";
import { SalaryEditor } from "../components/employees/SalaryEditor";
import { STATUS_LABELS, STATUS_STYLES } from "../constants/employees";
import { useEmployee } from "../hooks/useEmployee";
import { countryName, formatDate } from "../lib/format";
import type { SessionUser } from "../types/session";

type Props = {
  user: SessionUser;
};

export const EmployeeDetailPage = ({ user }: Props) => {
  const { id = "" } = useParams();
  const location = useLocation();
  const { employee, setEmployee, error, notFound, retry } = useEmployee(id);

  // The directory passes its query string so "Back" restores filters, sort and page.
  const directorySearch: unknown = location.state?.directorySearch;
  const backTo = `/employees${typeof directorySearch === "string" ? directorySearch : ""}`;

  const backLink = (
    <Link to={backTo} className='text-sm text-slate-600 hover:text-slate-900'>
      ← Back to employees
    </Link>
  );

  if (notFound) {
    return (
      <section className='space-y-4'>
        {backLink}
        <h2 className='text-xl font-semibold text-slate-900'>
          Employee not found
        </h2>
        <p className='text-slate-600'>
          This employee doesn't exist or the link is wrong.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className='space-y-4'>
        {backLink}
        <div
          role='alert'
          className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800'
        >
          <p>{error}</p>
          <button
            type='button'
            onClick={retry}
            className='mt-2 rounded border border-red-300 bg-white px-3 py-1 hover:bg-red-100'
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!employee) {
    return (
      <section className='space-y-4'>
        {backLink}
        <p role='status' className='text-slate-600'>
          Loading employee…
        </p>
      </section>
    );
  }

  const details: [string, string][] = [
    ["Email", employee.email],
    ["Job title", employee.job_title],
    ["Department", employee.department.name],
    ["Country", countryName(employee.country_code)],
    ["Currency", employee.currency],
    ["Hired", formatDate(employee.hired_on)],
  ];

  return (
    <section aria-labelledby='employee-heading' className='space-y-4'>
      {backLink}

      <div className='flex flex-wrap items-center gap-3'>
        <h2
          id='employee-heading'
          className='text-xl font-semibold text-slate-900'
        >
          {employee.first_name} {employee.last_name}
        </h2>
        <span className='font-mono text-sm text-slate-600'>
          {employee.employee_number}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[employee.status]}`}
        >
          {STATUS_LABELS[employee.status]}
        </span>
      </div>

      <dl className='grid gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-3'>
        {details.map(([label, value]) => (
          <div key={label}>
            <dt className='text-slate-500'>{label}</dt>
            <dd className='font-medium text-slate-900'>{value}</dd>
          </div>
        ))}
      </dl>

      <SalaryEditor
        employee={employee}
        canEdit={user.role === "admin"}
        onUpdated={setEmployee}
      />
    </section>
  );
};
