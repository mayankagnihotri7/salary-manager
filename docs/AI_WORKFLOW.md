# AI workflow

AI tools were used for discussing design, drafting code and specs. In the first phase I applied the code myself and ran the checks; in the second, an AI agent wrote the code and ran the checks, and I approved each design, tested the UI by hand, reviewed every diff and made every commit. This describes which tools, what they did, and how their output was checked.

## Tools

| Phase | Tool | How it was used |
|---|---|---|
| Requirements to employee directory (commits `0b88573`–`7450ac5`) | Claude (free tier), chat | Discussing design, drafting code and specs. I applied the code myself and ran the checks. |
| Employee detail to docs (commits `8b5a4fa` onward) | Claude Code (agentic, in VS Code) | Read the codebase, proposed designs, wrote code and specs, ran typecheck, lint, build, RSpec and the benchmarks. |

## How I worked with it

**Instructions file.** The agent worked from a standing instructions file that I wrote and
kept up to date ([CLAUDE.md](../CLAUDE.md)): stack and layout, verified API behaviour, and conventions (strong params
style, no new abstractions or libraries without a concrete need, RSpec only, correctness
before simplicity). It also listed the remaining steps in order, each to be reviewed on its
own.

**Design before code for UI work.** For each frontend step the agent first presented a plan
(files, states, error handling, what it would leave out) and waited for my approval. I
changed or narrowed plans at that point, for example "don't over-engineer it", the default
analytics grouping, and making the statistics table shared rather than copied.

**Verification rules.** The agent had to report which checks it actually ran and never claim
a result it had not seen. I reviewed every diff and made every commit myself.

**Manual testing.** There are no automated UI tests, so after each UI step I went through a
checklist by hand (viewer vs admin, validation errors, offline server, Back navigation,
invalid URLs) before committing.

**Questioning technical choices.** Before accepting the search index I asked whether trigram
search still reads the whole table, why not use `pg_search`, and how big the migration would
be. The index went in only after measured before/after numbers and its size and build time
were known.

## Mistakes caught, and how

| Problem | Who / what caught it |
|---|---|
| Analytics page went blank when switching from Department to Country grouping (the previous grouping's data was rendered for one frame and a department name was passed to a country-name lookup). Typecheck, lint and build all passed. | My manual testing |
| First before/after benchmark compared against an earlier, noisier run; unrelated endpoints had "improved" too. | The agent noticed the unrelated changes and re-ran before and after back-to-back |
| `bin/rails db:seed` did nothing: `db/seeds.rb` had never been wired to the seed tasks (the data had been loaded with the rake tasks directly). | The agent, while verifying setup steps for the README |
| Sign-in rate limit returned 500: the generator's HTML redirect was left in the JSON controller. | The agent, while verifying a claim for the docs; fixed with a 429 and a spec |
| The API client showed server error text, contrary to the intended design. | The agent, reviewing the code before the detail page |
| Notes I had written earlier claimed the rate limit was inactive and that `db:seed` worked; both were wrong. | Checking docs claims against the running code instead of trusting notes |
| `bin/ci` had never been run and failed: style offenses, a gem with a published security advisory (rack), and an unreviewed Brakeman warning. It also did not run the specs. | The agent, during a code-quality review I asked for near the end; fixed, and RSpec, typecheck and lint added to `bin/ci` |

## What I took from it

- Passing typecheck, lint and build says little about behaviour; the worst UI bug was only
  visible by clicking through the app.
- AI is most useful with explicit constraints and a review gate; it is least reliable when
  restating facts from memory, so claims in the docs were checked against the code.
- Performance claims need back-to-back measurement on the same machine, not a comparison
  with an earlier run.
