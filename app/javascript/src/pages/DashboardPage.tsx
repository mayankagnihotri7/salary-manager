import { Link } from "react-router";
import { useDashboard } from "../hooks/useDashboard";
import { formatCount, formatSalary } from "../lib/format";

const AMOUNT_COLUMNS = [
  ["min", "Min"],
  ["median", "Median"],
  ["avg", "Average"],
  ["max", "Max"],
] as const;

export const DashboardPage = () => {
  const { data, error, retry } = useDashboard();

  const renderContent = () => {
    if (error) {
      return (
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
      );
    }

    if (!data) {
      return (
        <p role='status' className='text-slate-600'>
          Loading dashboard…
        </p>
      );
    }

    if (data.currencies.length === 0) {
      return (
        <p className='rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-600'>
          No employees yet.
        </p>
      );
    }

    return (
      <>
        <div className='inline-block rounded-lg border border-slate-200 bg-white p-4'>
          <p className='text-3xl font-semibold tabular-nums text-slate-900'>
            {formatCount(data.headcount)}{" "}
            {data.headcount === 1 ? "employee" : "employees"}
          </p>
          <p className='mt-1 text-sm text-slate-600'>
            across {data.currencies.length}{" "}
            {data.currencies.length === 1 ? "currency" : "currencies"}
          </p>
        </div>

        <div className='overflow-x-auto rounded-lg border border-slate-200 bg-white'>
          <table className='min-w-full divide-y divide-slate-200 text-sm'>
            <caption className='sr-only'>Salary statistics per currency</caption>
            <thead className='bg-slate-50'>
              <tr>
                <th
                  scope='col'
                  className='px-3 py-2 text-left font-medium text-slate-600'
                >
                  Currency
                </th>
                <th
                  scope='col'
                  className='px-3 py-2 text-right font-medium text-slate-600'
                >
                  Employees
                </th>
                {AMOUNT_COLUMNS.map(([key, label]) => (
                  <th
                    key={key}
                    scope='col'
                    className='px-3 py-2 text-right font-medium text-slate-600'
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {data.currencies.map((row) => (
                <tr key={row.currency}>
                  <th scope='row' className='px-3 py-2 text-left font-medium'>
                    <Link
                      to={`/employees?currency=${row.currency}`}
                      className='text-slate-900 hover:underline'
                    >
                      {row.currency}
                    </Link>
                  </th>
                  <td className='px-3 py-2 text-right tabular-nums'>
                    {formatCount(row.headcount)}
                  </td>
                  {AMOUNT_COLUMNS.map(([key]) => (
                    <td
                      key={key}
                      className='whitespace-nowrap px-3 py-2 text-right tabular-nums'
                    >
                      {formatSalary(row[key], row.currency)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className='text-xs text-slate-500'>
          Each row covers one currency; amounts are never combined across
          currencies.
        </p>
      </>
    );
  };

  return (
    <section aria-labelledby='dashboard-heading' className='space-y-4'>
      <h2
        id='dashboard-heading'
        className='text-xl font-semibold text-slate-900'
      >
        Dashboard
      </h2>
      {renderContent()}
    </section>
  );
};
