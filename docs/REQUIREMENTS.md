# Employee Salary Management: Requirements v1

## Purpose
An internal HR tool for an organization of ~10,000 employees across multiple
countries. HR staff browse employees, review compensation, and maintain salaries.
Salary data is available only to authenticated users.

## Users
- **HR Admin**: read everything, edit salaries.
- **HR Viewer**: read-only.
Employees do not log in.

## Functional requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F1 | Sign in / sign out. Every salary-bearing endpoint requires authentication. | Must |
| F2 | Dashboard: total headcount and, per currency, headcount with min / average / median / max salary. | Must |
| F3 | Employee directory: server-side pagination, case-insensitive search (name, email, employee number), sorting, filters (department, country, currency, status). | Must |
| F4 | Employee detail view. | Must |
| F5 | Edit salary (Admin only). Validation: positive amount, max 2 decimals, upper bound, currency from the supported ISO 4217 list. The new value overwrites the old one; no history is kept. | Must |
| F6 | Analytics by department, by country, and by currency. Department and country breakdowns are always nested within a currency. | Must |

## Currency rules
- `country_code` and `currency` are independent attributes. A currency need not
  be the country's local currency (remote contractors, expatriates, regional pay).
- Currency must be a supported ISO 4217 code.
- Salary amounts in different currencies are **never** summed, averaged, or
  compared. Every aggregate is grouped by currency. No FX conversion in v1.

## Non-functional requirements
- **Reproducibility:** `bin/rails db:seed` deterministically creates the same
  10,000 synthetic employees on every run (fixed seed, no wall-clock dependence).
  Employees exist only through this script.
- **Performance:** Directory and analytics response times are *measured* at 10k
  rows. Indexed queries,
  capped page size, no N+1. No fixed latency guarantee is claimed.
- **Security:** Passwords hashed (bcrypt). Role checks enforced server-side.
  Salary data never returned to unauthenticated requests.
- **Quality:** Deterministic automated backend tests using RSpec only. The React
  UI has no automated tests. Incremental commits,
  documented design decisions.

## Out of scope (v1)
Currency conversion, payroll/tax, multi-tenancy, employee self-service, SSO,
bulk import/export, salary change history / audit trail, employee
create/edit/deactivate (employees are loaded only by the seed script),
automated frontend tests.

## Assumptions
- Data is synthetic. Salary is monthly gross in the stated currency.
- Employees exist only via the deterministic seed script. The UI covers listing,
  filtering, detail view, and salary editing.
- Search starts as plain case-insensitive substring matching; indexing is added
  only if measurements justify it.

## Acceptance summary
An Admin can sign in, find a specific employee among 10,000, change their salary,
and see the new value on the detail page and in per-currency analytics. A Viewer
can see but not edit. Unauthenticated requests receive 401.