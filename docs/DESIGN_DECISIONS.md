# Design decisions

Each entry gives the decision, why it was made, and what it costs.

## Product and data

**Salaries in different currencies are never combined.** Every statistic is grouped by
currency; department and country breakdowns are nested inside a currency; sorting by salary
sorts by currency first. An average of USD and JPY amounts is meaningless, and converting
would need exchange rates, which are out of scope. Cost: no single organisation-wide pay
figure.

**Country and currency are independent.** Remote contractors and people working abroad are often paid
in a currency other than their country's. The seed reflects this (USD salaries appear in
several countries).

**Median alongside average.** Salary distributions are skewed; the median answers "what does
a typical person earn" better than the mean. Postgres computes it with `PERCENTILE_CONT`.

**Two roles, admin and viewer.** The HR manager edits; others (e.g. finance) may only look.
Roles are checked on the server; the UI hides what a viewer cannot do.

**Salary editing overwrites the value.** No history or audit trail is kept (out of scope in
the requirements). Cost: there is no record of who changed what, which a real HR system
would need.

**Employees come only from the seed.** Creating, editing or deactivating employees and bulk
import are out of scope; the focus is browsing, analysing and editing salaries.

## Backend

**One Rails app serving the API and the SPA.** One deployable unit, same-origin requests
(no CORS), and cookie sessions with CSRF protection instead of tokens in local storage.
Cost: the frontend build is part of the Rails build.

**UUID primary keys and string-backed enums.** IDs in URLs reveal nothing about record counts
and cannot be guessed sequentially; string enums stay readable in the database and survive
reordering.

**Salary is sent and validated as the raw string.** The API rejects more than two decimals
by looking at what was typed, so `1.005` is an error rather than being silently rounded.
Upper bound 10,000,000,000; must be positive (also a database check constraint).

**Unknown filter values return an empty result, not an error.** A stale bookmark with a
removed department shows "no results" rather than breaking. Invalid sort, direction or page
values fall back to defaults; `per_page` is capped at 100.

**Search is case-insensitive substring matching, with trigram indexes.** Every term must
match the first name, last name, email or employee number. The requirements asked to add
indexing only if measurements justified it; they did (about 34 ms to 6 ms per request,
see [PERFORMANCE.md](PERFORMANCE.md)). The `pg_search` gem was considered and not used: it
builds queries but does not replace the indexes, and its matching differs (trigram mode is
fuzzy similarity with a threshold; full-text mode matches whole words, so `mith` would not
find `Smith`). It would also add ranking that conflicts with the directory's explicit sort.
It becomes the better choice if typo tolerance or relevance ranking is needed.

**OFFSET pagination.** Simple and supports "jump to page N". Cost: deep pages get slower
(about 28 ms for the last page at 10,000 rows). Keyset pagination would fix that; not needed
at this size.

**A deterministic seed.** A fixed random seed, fixed timestamps and UUIDv5 ids give the same
10,000 employees on every run, so demos and measurements are reproducible. Cost: reseeding
replaces all employees and undoes salary edits.

## Frontend

**No component library.** Tailwind with a handful of small components was enough for tables
and forms, and kept the bundle and dependencies small.

**The URL holds the view state.** Directory filters, sort and page, and the analytics
grouping, live in the query string, so Back, reload and shared links all work.

**Fixed client-side error messages.** The UI never shows text from the server's error
responses; each HTTP status maps to a fixed message. The one exception is salary validation
(422): those messages are shown next to the field, because they tell the user how to fix the
input.

**Filter option lists are duplicated in the frontend.** Countries, currencies and statuses
are listed in `constants/employees.ts` as well as on the server. Cost: adding a currency
means changing both. Departments are loaded from the API because they are data, not code.

## Testing

**RSpec for the backend; no automated frontend tests.** Request specs cover every endpoint
(auth, roles, validation, filters, sorting, pagination, statistics), with unit specs for
the statistics service and seed tasks. The UI was tested by hand against a checklist for each
page. With limited time, backend tests protect the rules that matter most (who can see and
change salaries, and correct statistics). Cost: UI regressions are only caught manually; a
frontend bug in the analytics page was found this way.

## Known limitations

- **Sessions never expire.** A session lasts until sign-out; there is no idle timeout.
- **No password reset** and no user management; demo users come from the seed.
- **Sign-in rate limit is per server.** 10 attempts per IP per 3 minutes, counted in the
  local cache store (memory in development, files in production), so counts are not shared
  between multiple servers.
- **Search terms under 3 characters** cannot use the trigram indexes and scan the table.
- **Analytics are computed on every request** from the whole table. Fine at 10,000 rows;
  a much larger dataset would need cached or precomputed statistics.
- **Not deployed.** The app is demonstrated locally (see the README).
