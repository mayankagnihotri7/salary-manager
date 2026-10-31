import { PER_PAGE_OPTIONS } from "../../constants/employees";
import { formatCount } from "../../lib/format";
import type { PageMeta } from "../../types/employee";

type Props = {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

// Only rendered for a non-empty page (EmployeesPage handles the empty and out-of-range cases),
// so the range below is always valid, never "1–0 of 0".
export const Pagination = ({ meta, onPageChange, onPerPageChange }: Props) => {
  const {
    page,
    per_page: perPage,
    total_count: totalCount,
    total_pages: totalPages,
  } = meta;
  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, totalCount);

  return (
    <nav
      aria-label='Pagination'
      className='flex flex-wrap items-center justify-between gap-3 text-sm'
    >
      <p className='text-slate-600'>
        Showing {formatCount(first)}–{formatCount(last)} of{" "}
        {formatCount(totalCount)}
      </p>

      <div className='flex flex-wrap items-center gap-3'>
        <label className='flex items-center gap-2 text-slate-600'>
          Rows per page
          <select
            value={perPage}
            onChange={(event) => onPerPageChange(Number(event.target.value))}
            className='rounded border border-slate-300 bg-white px-2 py-1'
          >
            {PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          type='button'
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className='rounded border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-50'
        >
          Previous
        </button>
        <span className='text-slate-600'>
          Page {formatCount(page)} of {formatCount(totalPages)}
        </span>
        <button
          type='button'
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className='rounded border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-50'
        >
          Next
        </button>
      </div>
    </nav>
  );
};
