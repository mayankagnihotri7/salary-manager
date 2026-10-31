import { Link } from "react-router";
import { ErrorAlert } from "../components/ErrorAlert";
import { StatisticsTable } from "../components/StatisticsTable";
import { useDashboard } from "../hooks/useDashboard";
import { formatCount } from "../lib/format";

export const DashboardPage = () => {
  const { data, error, retry } = useDashboard();

  const renderContent = () => {
    if (error) {
      return (
        <ErrorAlert message={error} onRetry={retry} />
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

        <StatisticsTable
          caption='Salary statistics per currency'
          labelHeader='Currency'
          rows={data.currencies.map((row) => ({
            ...row,
            id: row.currency,
            label: (
              <Link
                to={`/employees?currency=${row.currency}`}
                className='text-slate-900 hover:underline'
              >
                {row.currency}
              </Link>
            ),
          }))}
        />
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
