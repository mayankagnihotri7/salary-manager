# Salary Manager: project handoff

Take-home for Incubyte (Software Craftsperson / ROR I/II): employee salary management for ~10,000 employees across countries. Requirements: docs/REQUIREMENTS.md (v1 scope is final). Submission needs: working app, demo video, tests, incremental commits, and docs (architecture, design decisions, performance, honest AI workflow).

## Environment
Fedora KDE; Ruby 3.3.1; Rails 8.1; Node 24; PostgreSQL (client 18). In my zsh plain `curl` is not found: use `/usr/bin/curl` and `/usr/bin/grep` in shell commands. Free tools only.

## Stack and layout
- One Rails 8.1 app at the repo root (not --api). React 19-era SPA in `app/javascript` (Vite via `vite_rails`, TypeScript strict, Tailwind v4 via @tailwindcss/vite, React Router, Axios, Sonner). Entry: `app/javascript/entrypoints/application.tsx`; app code in `app/javascript/src/{api,types,constants,lib,hooks,contexts,components,pages,routes}`.
- Dev: run `bin/rails s` AND `bin/vite dev`. Production build: Rails serves the built SPA; `HomeController#index` serves the HTML shell, a catch-all route (last in config/routes.rb, excludes /api) serves client routes.
- Secrets via env (`SECRET_KEY_BASE`); no credentials/master key.

## Backend facts
- UUID primary keys everywhere. Enums are string-backed (never integer).
- `employees`: employee_number (unique), names, email (unique, normalized), job_title, department_id, country_code, currency (independent of country), salary numeric(14,2) (>0 check, max 10_000_000_000, max 2 decimals validated on raw input), hired_on, status (active/on_leave/terminated). Model `normalizes` country_code/currency (strip+upcase), which also applies to where() queries.
- Auth: Rails 8.1 authentication generator (User#email_address, has_secure_password, role viewer/admin enum; DB-backed Session; signed `session_id` cookie; Current) adapted to JSON in `Api::V1::SessionsController`. `Api::V1::BaseController` gives JSON 401, 404 and 400 handling and `require_admin`. CSRF is on: non-GET needs `X-CSRF-Token` from the `<meta name="csrf-token">`.
- API (all /api/v1): `resource :session` (show/create/destroy); `employees` index (params: q, department_id, country_code, currency, status, sort, dir, page, per_page; search = ILIKE on name/email/number, per term; sort whitelist with id tie-break; salary sort is by currency then amount; per_page capped at 100), show, update (admin only, permits only :salary, returns the full employee, 422 `{errors}`); `departments` index (id, name, employees_count via LEFT JOIN, alphabetical); `dashboard` and `analytics?group_by=currency|department|country` from `SalaryStatistics` (min/avg/median/max per currency; breakdowns are always nested inside a currency; never mix currencies).
- Verified live contract: unknown filter values return 200 with 0 results; sort/dir/page fall back to defaults; page past the end returns 200 with 0 rows and the true total; per_page honored up to 100.
- Seed: `bin/rails db:seed` (db/seeds.rb) and the rake tasks `seed:all`, `seed:employees[count,seed]` and `seed:demo_users` all call `SeedTasks::Employees` (deterministic: seeded Random + Faker, UUIDv5 ids, fixed timestamps, single insert_all! in a transaction, replaces all employees) and `SeedTasks::DemoUsers` (SEED_ADMIN_EMAIL/PASSWORD, SEED_VIEWER_EMAIL/PASSWORD; dev defaults admin@example.com / demo-admin-password and viewer@example.com / demo-viewer-password; production requires passwords).

## Frontend facts
- `api/client.ts`: one Axios instance (baseURL /api/v1, withCredentials, 10 s timeout), request interceptor adds the CSRF header, response interceptor only normalizes errors to `ApiError` (fixed client-side messages, no `cause`, never shows server text, never changes auth state).
- `SessionProvider`: status loading/signedOut/signedIn/error; operation IDs so stale results can't overwrite newer state; one submit lock; sign-out always clears client state; `expire()` is idempotent and ignores 401s during a user-initiated sign-in/out; Sonner toasts for sign-in, confirmed sign-out and session expiry.
- Directory: URL is the source of truth (`useEmployeeQuery`); search is debounced 300 ms with `replace`, other changes push history; `useEmployees` keeps the last successful data on failure and aborts stale requests; filter option lists in `constants/employees.ts` mirror the backend; unknown filter values show "(unknown)" options; salaries show currency codes.

## Conventions (follow these)
- Strong params: private `*_params` using `params.require(:key).permit(...)` (never `params.expect`); never read request params directly.
- Keep it simple: no extra abstractions, hooks, context, files, or libraries without a concrete need; arrow-function components, named exports, typed props, strict TS, minimal ESLint (typescript-eslint + react-hooks).
- Tests: RSpec only for the backend (FactoryBot + Faker, Faker seeded per example); request specs for the API, unit specs for services, a few wiring specs; NO frontend test framework, the UI is checked manually against a checklist after each UI step.
- Correctness first, simplicity second; don't refactor working code just to shorten it.
- Frontend work: present the design and wait for approval before implementing; when editing an existing file, show only the change and where it goes.
- Be honest about verification: report which checks you actually ran (`npm run typecheck`, `npm run lint`, `bin/vite build`, `bundle exec rspec`) and which you didn't; never claim a pass you didn't see. Commit at milestones; I review diffs first.

## Status
Complete: everything, including the demo video. Requirements, schema/models, auth, seed (`db:seed` wired), all APIs, sign-in/session, directory, employee detail + admin salary editing, dashboard, analytics, pg_trgm search indexes (measured in docs/PERFORMANCE.md), docs (README, ARCHITECTURE, DESIGN_DECISIONS, AI_WORKFLOW), shared data loading (`useApiData`). `bin/ci` passes (setup, RuboCop, bundler-audit, Brakeman, RSpec, typecheck, lint). Salary amounts are annual.

Decided: no deployment (README says the app runs locally); no frontend test framework.
