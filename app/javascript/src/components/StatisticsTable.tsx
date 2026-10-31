import type { ReactNode } from "react";
import { formatCount, formatSalary } from "../lib/format";
import type { CurrencyStatistics } from "../types/statistics";

const AMOUNT_COLUMNS = [
  ["min", "Min"],
  ["median", "Median"],
  ["avg", "Average"],
  ["max", "Max"],
] as const;

// Every row carries its own currency, so amounts are always formatted in the right one.
export type StatisticsRow = CurrencyStatistics & {
  id: string;
  label: ReactNode;
  isTotal?: boolean;
};

type Props = {
  caption: string;
  labelHeader: string;
  rows: StatisticsRow[];
};

export const StatisticsTable = ({ caption, labelHeader, rows }: Props) => (
  <div className='overflow-x-auto rounded-lg border border-slate-200 bg-white'>
    <table className='min-w-full divide-y divide-slate-200 text-sm'>
      <caption className='sr-only'>{caption}</caption>
      <thead className='bg-slate-50'>
        <tr>
          <th
            scope='col'
            className='px-3 py-2 text-left font-medium text-slate-600'
          >
            {labelHeader}
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
        {rows.map((row) => (
          <tr
            key={row.id}
            className={row.isTotal ? "bg-slate-50 font-semibold" : undefined}
          >
            <th
              scope='row'
              className={`px-3 py-2 text-left ${row.isTotal ? "font-semibold" : "font-medium"}`}
            >
              {row.label}
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
);
