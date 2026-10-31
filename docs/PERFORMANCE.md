# Performance

Measured, not guaranteed. All numbers come from one developer laptop against the seeded
dataset; they show relative cost and where the hotspots are, not production latency.

## Setup

| | |
|---|---|
| Machine | AMD Ryzen 7 7435HS (16 threads), 15 GiB RAM, Fedora |
| Database | PostgreSQL 18.6, local, default configuration |
| App | Rails 8.1, **development** environment, Ruby 3.3.1 |
| Data | 10,000 employees, 8 departments, 12 countries, 11 currencies (`bin/rails db:seed`) |

## Method

`script/benchmark.rb` calls the real API endpoints in-process through a Rails integration
session, signed in as the seeded admin. Each case is warmed up once, then timed 30 times;
the median is reported. Timings include routing, authentication, the queries and JSON
rendering, but not the network or the browser.

```sh
bin/rails db:seed
bin/rails runner script/benchmark.rb
```

Database-only numbers come from `EXPLAIN (ANALYZE, BUFFERS)` on the SQL each endpoint runs.
`EXPLAIN ANALYZE` adds instrumentation overhead, so its times read somewhat higher than the
same work inside a request.

Run-to-run noise on this machine is large (an earlier session measured some cases about 2×
slower across the board), so before/after comparisons below were run back-to-back, twice
each, with nothing else changed.

## Results

Request medians in ms, two runs each, before and after adding trigram indexes for search:

| Case | Before | After |
|---|---|---|
| Index, default sort, page 1 | 6.4 / 6.6 | 7.3 / 7.0 |
| Index, per_page=100 | 10.0 / 11.4 | 11.1 / 11.0 |
| Index, last page (offset 9,975) | 27.6 / 30.6 | 29.0 / 27.2 |
| Index, sort=salary desc | 8.0 / 8.8 | 8.7 / 8.1 |
| Index, sort=department | 11.2 / 12.7 | 13.0 / 11.6 |
| Filters: department + country + status | 7.0 / 7.7 | 8.4 / 7.1 |
| Search, 2-character term (`an`) | 18.3 / 18.5 | 20.6 / 19.3 |
| Search, rare last name | 34.3 / 34.6 | **7.3 / 6.5** |
| Search, first + last name (2 terms) | 34.5 / 33.0 | **7.3 / 6.0** |
| Search, employee number | 36.0 / 34.9 | **6.7 / 5.8** |
| Search, no match | 33.9 / 31.9 | **6.3 / 5.6** |
| Dashboard | 12.0 / 11.0 | 14.0 / 11.7 |
| Analytics, group_by=currency | 10.6 / 10.6 | 12.4 / 11.1 |
| Analytics, group_by=department | 24.2 / 22.9 | 23.4 / 23.7 |
| Analytics, group_by=country | 19.7 / 19.1 | 21.3 / 20.3 |

Everything except search is unchanged within noise. Every case stays under about 35 ms.

## Search and pg_trgm

Search is `ILIKE '%term%'` on first name, last name, email and employee number, once per
term (`Employee.search`). A leading wildcard cannot use a B-tree index, so before the change
every search read all 10,000 rows. The endpoint runs this twice per request (count and page).

| Search, database time (`EXPLAIN ANALYZE`) | Seq scan | Trigram indexes |
|---|---|---|
| Rare last name | 37 ms | 0.2 ms |
| Two terms | 39 ms | 0.2 ms |
| Employee number | 42 ms | 0.5 ms |
| No match | 39 ms | 0.1 ms |
| `an` (2 characters) | 32 ms | 32 ms (still a seq scan) |

The migration `AddTrigramSearchIndexesToEmployees` enables `pg_trgm` and adds a GIN
`gin_trgm_ops` index on each of the four columns. The query is unchanged: Postgres combines
the four indexes with a `BitmapOr`, then rechecks the `ILIKE` only on the candidate rows:

```
Bitmap Heap Scan on employees  (actual rows=20)
  Recheck Cond: (first_name ~~* '%Haag%' OR last_name ~~* '%Haag%' OR email ~~* … OR employee_number ~~* …)
  ->  BitmapOr
        ->  Bitmap Index Scan on index_employees_on_first_name_trigram
        ->  Bitmap Index Scan on index_employees_on_last_name_trigram
        ->  Bitmap Index Scan on index_employees_on_email_trigram
        ->  Bitmap Index Scan on index_employees_on_employee_number_trigram
Execution Time: 0.191 ms
```

Cost of the indexes at 10,000 rows:

| Index | Size | Build time |
|---|---|---|
| first_name | 424 kB | 21 ms |
| last_name | 360 kB | 17 ms |
| email | 1,168 kB | 74 ms |
| employee_number | 344 kB | 18 ms |
| Total | about 2.3 MB | about 130 ms |

For comparison, the table is 3.6 MB and its other indexes 5.5 MB. Writes to these four
columns get slightly slower; salary edits do not touch them.

## Known limits

- **Terms shorter than 3 characters** contain no trigram, so they still scan the table
  (about 18–20 ms per request here). This grows linearly with the number of employees.
- **Deep pages use OFFSET.** For the last page Postgres sorts all rows instead of walking
  the `employee_number` index (about 28 ms here; the sort dominates, because text sorts under
  a locale-aware collation). Keyset pagination would fix this; it was not worth the extra
  complexity at this size.
- **Analytics and the dashboard scan the whole table** on every request, because the median
  (`PERCENTILE_CONT`) needs every salary. At 10,000 rows this is about 10–24 ms. Much larger
  datasets would need cached or precomputed statistics.
- **Not measured:** production mode, concurrent load, network latency and browser rendering.
