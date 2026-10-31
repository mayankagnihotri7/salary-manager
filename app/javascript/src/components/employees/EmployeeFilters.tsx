import { useEffect, useRef, useState } from "react";
import {
  COUNTRY_CODES,
  CURRENCIES,
  STATUS_LABELS,
  STATUSES,
} from "../../constants/employees";
import type { DepartmentsStatus } from "../../hooks/useDepartments";
import { countryName, formatCount } from "../../lib/format";
import type {
  Department,
  EmployeeQuery,
  UpdateEmployeeQuery,
} from "../../types/employee";

const SEARCH_DEBOUNCE_MS = 300;

type Option = { value: string; label: string };

const COUNTRY_OPTIONS: Option[] = COUNTRY_CODES.map((code) => ({
  value: code,
  label: `${countryName(code)} (${code})`,
})).sort((a, b) => a.label.localeCompare(b.label));
const CURRENCY_OPTIONS: Option[] = CURRENCIES.map((currency) => ({
  value: currency,
  label: currency,
}));
const STATUS_OPTIONS: Option[] = STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABELS[status],
}));

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  options: Option[];
  allLabel: string;
  unknownLabel: string;
  hint?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

const SelectField = ({
  id,
  label,
  value,
  options,
  allLabel,
  unknownLabel,
  hint,
  disabled = false,
  onChange,
}: SelectFieldProps) => {
  const isUnknown =
    value !== "" && !options.some((option) => option.value === value);

  return (
    <div>
      <label htmlFor={id} className='block text-xs font-medium text-slate-600'>
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className='mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-2 text-sm disabled:opacity-60'
      >
        <option value=''>{allLabel}</option>
        {isUnknown && <option value={value}>{unknownLabel}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={`${id}-hint`} className='mt-1 text-xs text-red-700'>
          {hint}
        </p>
      )}
    </div>
  );
};

type Props = {
  query: EmployeeQuery;
  departments: Department[];
  departmentsStatus: DepartmentsStatus;
  hasActiveFilters: boolean;
  onChange: UpdateEmployeeQuery;
  onClear: () => void;
};

export const EmployeeFilters = ({
  query,
  departments,
  departmentsStatus,
  hasActiveFilters,
  onChange,
  onClear,
}: Props) => {
  const [draft, setDraft] = useState(query.q);
  // The last search value this input sent to the URL or adopted from it.
  const lastCommitted = useRef(query.q);
  // The pending commit calls the latest onChange, so a changing callback never restarts the debounce.
  const latestOnChange = useRef(onChange);

  useEffect(() => {
    latestOnChange.current = onChange;
  });

  // A URL change that did not come from this input (back/forward, "Clear filters", a link)
  // replaces the draft. This input's own commits come back through here too, but they equal
  // lastCommitted and are ignored, so they never overwrite what the user is still typing.
  useEffect(() => {
    if (query.q !== lastCommitted.current) {
      lastCommitted.current = query.q;
      setDraft(query.q);
    }
  }, [query.q]);

  // Commits the draft after a pause. The cleanup cancels the pending commit on every keystroke,
  // when an external change replaces the draft, and on unmount.
  useEffect(() => {
    if (draft.trim() === lastCommitted.current) return;

    const timer = setTimeout(() => {
      const trimmed = draft.trim();
      if (trimmed !== lastCommitted.current) {
        lastCommitted.current = trimmed;
        latestOnChange.current({ q: trimmed }, { replace: true });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [draft]);

  const departmentOptions: Option[] = departments.map((department) => ({
    value: department.id,
    label: `${department.name} (${formatCount(department.employees_count)})`,
  }));

  return (
    <form
      role='search'
      aria-label='Employee filters'
      onSubmit={(event) => event.preventDefault()}
      className='grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6'
    >
      <div className='sm:col-span-2'>
        <label
          htmlFor='employee-search'
          className='block text-xs font-medium text-slate-600'
        >
          Search
        </label>
        <input
          id='employee-search'
          type='search'
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder='Name, email or employee number'
          autoComplete='off'
          className='mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm'
        />
      </div>

      <SelectField
        id='filter-department'
        label='Department'
        value={query.department_id}
        options={departmentOptions}
        allLabel='All departments'
        unknownLabel={
          departmentsStatus === "loading" ? "Loading…" : "Unknown department"
        }
        hint={
          departmentsStatus === "failed"
            ? "Departments unavailable."
            : undefined
        }
        disabled={departmentsStatus === "failed"}
        onChange={(value) => onChange({ department_id: value })}
      />

      <SelectField
        id='filter-country'
        label='Country'
        value={query.country_code}
        options={COUNTRY_OPTIONS}
        allLabel='All countries'
        unknownLabel={`${query.country_code} (unknown)`}
        onChange={(value) => onChange({ country_code: value })}
      />

      <SelectField
        id='filter-currency'
        label='Currency'
        value={query.currency}
        options={CURRENCY_OPTIONS}
        allLabel='All currencies'
        unknownLabel={`${query.currency} (unknown)`}
        onChange={(value) => onChange({ currency: value })}
      />

      <SelectField
        id='filter-status'
        label='Status'
        value={query.status}
        options={STATUS_OPTIONS}
        allLabel='All statuses'
        unknownLabel={`${query.status} (unknown)`}
        onChange={(value) => onChange({ status: value })}
      />

      {hasActiveFilters && (
        <div className='sm:col-span-2 lg:col-span-6'>
          <button
            type='button'
            onClick={onClear}
            className='rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100'
          >
            Clear filters
          </button>
        </div>
      )}
    </form>
  );
};
