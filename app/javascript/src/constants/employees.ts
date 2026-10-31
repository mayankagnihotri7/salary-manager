export const COUNTRY_CODES = [
  "US",
  "GB",
  "DE",
  "FR",
  "IN",
  "JP",
  "AU",
  "CA",
  "SG",
  "BR",
  "MX",
  "ZA",
] as const;

export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "JPY",
  "AUD",
  "CAD",
  "SGD",
  "BRL",
  "MXN",
  "ZAR",
] as const;

export const STATUSES = ["active", "on_leave", "terminated"] as const;
export type EmployeeStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: "Active",
  on_leave: "On leave",
  terminated: "Terminated",
};

export const SORTS = [
  "employee_number",
  "name",
  "job_title",
  "department",
  "country_code",
  "currency",
  "salary",
  "hired_on",
  "status",
] as const;
export type EmployeeSort = (typeof SORTS)[number];

export const PER_PAGE_OPTIONS = [25, 50, 100] as const;
export const DEFAULT_PER_PAGE = 25;
