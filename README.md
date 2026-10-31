# Salary Manager

A web app for an HR team to manage salaries for 10,000 employees across 12 countries and
11 currencies, and to answer questions about how the organisation pays people.

- **Directory**: search, filter, sort and page through all employees.
- **Detail and salary editing**: admins edit a salary; viewers are read-only.
- **Dashboard**: headcount plus min / median / average / max salary per currency.
- **Analytics**: the same statistics by department or country, always within a currency.

Stack: Rails 8.1 (JSON API) + PostgreSQL, with a React 19 + TypeScript SPA (Vite,
Tailwind, React Router) served by the same Rails app.

The app is not deployed; it runs locally with the steps below.

## Documents

| | |
|---|---|
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | One-page requirements: scope, features, what is left out and why |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the pieces fit, with a diagram |
| [docs/DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) | Decisions, trade-offs and known limitations |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md) | Measured timings at 10,000 rows and the search index |
| [docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md) | How AI tools were used and how their output was checked |

## Requirements

- Ruby 3.3.1
- Node 24 and npm
- PostgreSQL (developed on 18) running locally, with the `pg_trgm` extension available
  (it ships with standard PostgreSQL packages; on some distributions it is in a
  `postgresql-contrib` package)

## Setup

```sh
bundle install
npm install
bin/rails db:prepare   # creates the databases and runs the migrations
bin/rails db:seed      # 10,000 employees + a demo admin and viewer
```

`config/database.yml` connects to the local PostgreSQL as your OS user. Set `DATABASE_URL`
if yours needs a different user, password or host.

The seed is deterministic: every run produces the same 10,000 employees. It **replaces** all
employees and departments, so it also undoes any salary edits.

## Run

In two terminals:

```sh
bin/rails server   # http://localhost:3000
bin/vite dev       # Vite dev server with hot reload
```

Sign in with one of the demo accounts:

| Role | Email | Password | Can |
|---|---|---|---|
| Admin | admin@example.com | demo-admin-password | View everything, edit salaries |
| Viewer | viewer@example.com | demo-viewer-password | View everything |

The emails and passwords can be overridden with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`,
`SEED_VIEWER_EMAIL` and `SEED_VIEWER_PASSWORD` when seeding. In production the passwords are
required.

Other seed tasks:

```sh
bin/rails "seed:employees[500,7]"   # 500 employees with random seed 7
bin/rails seed:demo_users           # only (re)create the demo users
```

## Tests and checks

```sh
bundle exec rspec    # backend: 112 examples, about 10 s
npm run typecheck    # TypeScript, strict
npm run lint         # ESLint
bin/vite build       # production build of the frontend
```

The backend tests are request specs for every endpoint, unit specs for the statistics
service and the seed tasks, and model specs. They are deterministic (Faker is seeded per
example). The UI has no automated tests by design; it was checked by hand
(see [docs/DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md)).

## Benchmark

```sh
bin/rails runner script/benchmark.rb
```

Times the API endpoints in-process against the seeded data. Results and method are in
[docs/PERFORMANCE.md](docs/PERFORMANCE.md).
