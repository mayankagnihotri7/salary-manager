import { useSearchParams } from "react-router";
import { ErrorAlert } from "../components/ErrorAlert";
import { StatisticsTable } from "../components/StatisticsTable";
import { useAnalytics } from "../hooks/useAnalytics";
import { countryName, formatCount } from "../lib/format";
import type { AnalyticsResponse, GroupBy } from "../types/statistics";

const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "currency", label: "Currency" },
  { value: "department", label: "Department" },
  { value: "country", label: "Country" },
];

const DEFAULT_GROUP_BY: GroupBy = "department";

export const AnalyticsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const groupBy =
    GROUP_BY_OPTIONS.find(({ value }) => value === searchParams.get("group_by"))
      ?.value ?? DEFAULT_GROUP_BY;
  const { data, error, retry } = useAnalytics(groupBy);

  const groupLabel = (key: string) =>
    groupBy === "country" ? `${countryName(key)} (${key})` : key;

  const renderResults = ({ currencies }: AnalyticsResponse) => {
    if (currencies.length === 0) {
      return (
        <p className='rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-600'>
          No employees yet.
        </p>
      );
    }

    if (groupBy === "currency") {
      return (
        <StatisticsTable
          caption='Salary statistics per currency'
          labelHeader='Currency'
          rows={currencies.map((row) => ({
            ...row,
            id: row.currency,
            label: row.currency,
          }))}
        />
      );
    }

    return currencies.map(({ groups = [], ...total }) => (
      <section
        key={total.currency}
        aria-labelledby={`currency-${total.currency}`}
        className='space-y-2'
      >
        <h3
          id={`currency-${total.currency}`}
          className='font-semibold text-slate-900'
        >
          {total.currency}{" "}
          <span className='font-normal text-slate-600'>
            · {formatCount(total.headcount)}{" "}
            {total.headcount === 1 ? "employee" : "employees"}
          </span>
        </h3>
        <StatisticsTable
          caption={`Salary statistics in ${total.currency} by ${groupBy}`}
          labelHeader={groupBy === "country" ? "Country" : "Department"}
          rows={[
            {
              ...total,
              id: "all",
              label: `All ${total.currency}`,
              isTotal: true,
            },
            ...groups.map((group) => ({
              ...group,
              id: group.key,
              label: groupLabel(group.key),
              currency: total.currency,
            })),
          ]}
        />
      </section>
    ));
  };

  return (
    <section aria-labelledby='analytics-heading' className='space-y-4'>
      <h2
        id='analytics-heading'
        className='text-xl font-semibold text-slate-900'
      >
        Analytics
      </h2>

      <div
        role='group'
        aria-label='Group by'
        className='inline-flex items-center gap-2 text-sm'
      >
        <span className='text-slate-600'>Group by</span>
        {GROUP_BY_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type='button'
            aria-pressed={value === groupBy}
            onClick={() => setSearchParams({ group_by: value })}
            className={`rounded border px-3 py-1 ${
              value === groupBy
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <ErrorAlert message={error} onRetry={retry} />
      )}

      {!data && !error && (
        <p role='status' className='text-slate-600'>
          Loading analytics…
        </p>
      )}

      {data && renderResults(data)}

      {data && data.currencies.length > 0 && (
        <p className='text-xs text-slate-500'>
          Statistics are calculated within each currency; amounts are never
          combined across currencies.
        </p>
      )}
    </section>
  );
};
