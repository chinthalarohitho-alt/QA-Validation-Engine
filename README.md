# QA Validation Engine

[![PR checks](https://github.com/OWNER/qa-validation-engine/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/OWNER/qa-validation-engine/actions/workflows/pr-checks.yml)
[![Nightly regression](https://github.com/OWNER/qa-validation-engine/actions/workflows/nightly.yml/badge.svg)](https://github.com/OWNER/qa-validation-engine/actions/workflows/nightly.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-BDD-2EAD33?logo=playwright&logoColor=white)
![k6](https://img.shields.io/badge/k6-load-7D64FF?logo=k6&logoColor=white)
![Allure](https://img.shields.io/badge/Allure-3-FF6F00)

> One repository, one runner, three kinds of testing: **web UI**, **API contracts** and
> **load**. All three report into a single Allure 3 report, and GitHub Actions runs them on every
> pull request and every night.

This framework mirrors the architecture of a production framework I built for a multi-product
healthcare SaaS platform. This public version runs against three public demo systems instead, so
anyone can clone it and watch every lane pass.

---

## Contents

- [At a glance](#at-a-glance)
- [Highlights](#highlights)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Commands](#commands)
- [CI/CD pipeline](#cicd-pipeline)
- [Conventions](#conventions)
- [Adding a test](#adding-a-test)
- [Known defects and lessons learned](#known-defects-and-lessons-learned)

---

## At a glance

| Product | Target | Lane | What it proves |
|---|---|---|---|
| `storefront` | [SauceDemo](https://www.saucedemo.com) | Web UI: Playwright + Gherkin | Login, catalogue, cart, and checkout totals, per persona |
| `shop-api` | [DummyJSON](https://dummyjson.com) | API: Playwright + Gherkin, no browser | Contracts (JSON Schema), an auth guard matrix, pagination, search and sort, cart arithmetic |
| `pizza-service` | [QuickPizza](https://quickpizza.grafana.com) (Grafana's k6 demo) | Load: k6 | p95 budgets per endpoint, and correctness checks held *under load* |

| Web scenarios | API scenarios | Load scripts | Results in one report | Real defects found |
|:-:|:-:|:-:|:-:|:-:|
| 30 | 35 | 2 (21 thresholds + checks) | 86 | 4 |

Each defect is pinned by a self-retiring test. See [Known defects](knowledge-base/known-defects.md).

## Highlights

- **Money is asserted in integer cents and re-derived from what the user saw.** The checkout
  tests record each price as it is added from the catalogue. They then check subtotal, 8% tax
  and total separately, so the report names *which* rule broke. A mutation test (changing the
  tax rate from 8% to 7%) makes them fail on the exact cents.
- **Personas by tag.** `@as-problem-user` runs a scenario as a different account. Each persona
  signs in once per run in `globalSetup`. Its saved session is reused only while the session
  cookie itself is still valid.
- **Self-retiring known defects.** A scenario tagged `@known-defect @fail` is *expected* to
  fail. The build stays green while the bug exists and turns red the day it is fixed, so a
  known defect can't outlive its bug unnoticed.
- **An auth matrix, not one negative test.** Every protected route is tested with no header, an
  empty header, a non-JWT, and a tampered JWT. Building the matrix surfaced a real defect: a
  tampered signature answers **500** instead of 401.
- **Load tests that check answers, not only status codes.** Under load, a service can stay fast
  by returning wrong results. The k6 scripts assert that each recommendation honours the
  vegetarian, exclusion and calorie constraints it was asked for.
- **k6 results in the same report.** k6 has no `process`, so a runner injects hosts from the
  single env config. It then turns each k6 threshold and check into an Allure test.
- **Sharded CI with one merged report**, plus nightly history trends published to GitHub Pages.

## Tech stack

| Concern | Tool |
|---|---|
| Language | TypeScript (strict), Node 24 |
| Runner (web + API) | [Playwright Test](https://playwright.dev) |
| BDD | [playwright-bdd](https://vitalets.github.io/playwright-bdd) with Gherkin `.feature` files |
| Contract validation | [Ajv](https://ajv.js.org) (JSON Schema) |
| Load | [Grafana k6](https://grafana.com/docs/k6/) (native TypeScript) |
| Reporting | [Allure Report 3](https://allurereport.org), plus the Playwright HTML report |
| CI/CD | GitHub Actions, GitHub Pages, optional Slack notifications |

## Architecture

The layout separates **what** is tested (`projects/`, organised by product and module) from
**how** it is tested (`shared/`, reused by every product).

```
projects/                          # WHAT is tested: feature files and k6 scripts, by product
  storefront/<module>/ui/{smoke,regression}/*.feature
  shop-api/<module>/api/{smoke,regression}/*.feature
  pizza-service/<module>/k6/*.ts
shared/                            # HOW it is tested: reused by every product
  config/        env.config.ts (one host table) · roles.config.ts (personas) · auth.setup.ts
  ui/            pages/ (page objects) · steps/ · fixtures/ (persona + page-object injection)
  api/           request.client.ts · schemas/ · payloads/ · steps/ · fixtures/
  k6/            profiles and thresholds (k6.config.ts) · k6-side env access (runtime.ts)
  factories/     test-data builders
  scripts/       run-k6.ts · k6-to-allure.ts
  money.helper.ts                  # cent-exact arithmetic shared by UI and API assertions
knowledge-base/                    # known defects, open questions, lessons learned
.github/                           # PR + nightly workflows, a composite setup action
```

```
            env.config.ts  (one host table, selected by TEST_ENV)
                 │
     ┌───────────┼─────────────────────┐
     ▼           ▼                     ▼
  Web lane    API lane              run-k6.ts ──-e──▶ k6 scripts
  (browser)   (no browser)               │
     │           │                  k6-to-allure.ts
     ▼           ▼                       ▼
 allure-results/web  allure-results/api  allure-results/k6
                 └───────────┬───────────┘
                             ▼
                  One combined Allure 3 report
```

Design decisions worth calling out:

- **Two Playwright lanes from separate `defineBddConfig` calls.** The API lane's steps never ask
  for `page`, so Playwright never launches a browser for them.
- **One environment table.** Add a `staging` block to `env.config.ts`, then set
  `TEST_ENV=staging`. That points every lane, k6 included, at the new environment.
- **Page objects wait for the destination page's title after every navigation**, not the URL.
  The single-page app changes the URL before the old page unmounts.
- **A fresh API request context per scenario.** `/auth/login` also sets a cookie, and a shared
  cookie jar would silently authenticate "no-token" requests.

## Getting started

**Prerequisites:** Node (version in `.nvmrc`) and [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/).

```bash
nvm use
npm ci
npx playwright install chromium
brew install k6               # or see the k6 install guide

npm run test:everything       # clean, typecheck, then all three lanes
npm run allure:all            # open the combined report
```

You don't need a `.env` file: every credential defaults to the targets' published demo login.
`.env.example` shows where real secrets would go.

## Commands

| Command | Runs |
|---|---|
| `npm test` | All web scenarios |
| `npm run test:smoke` / `test:regression` | Web, by tag |
| `npm run test:api` | All API scenarios (no browser) |
| `npm run k6:all` | Every k6 script, smoke profile |
| `npm run k6 -- <script> --profile load` | One k6 script with another profile (`smoke`, `load`, `stress`) |
| `npm run test:everything` | Clean, typecheck, then all three lanes |
| `npm run allure:all` | Build and open the combined report |
| `npm run quality` | Typecheck (Node + k6) and BDD generation |

## CI/CD pipeline

**Pull requests** ([`pr-checks.yml`](.github/workflows/pr-checks.yml))

```
quality (typecheck + bddgen) ──┬── API (smoke + regression)
                               ├── Web smoke, shard 1/2 ┐
                               ├── Web smoke, shard 2/2 ┤──▶ Allure report (artifact)
                               └── k6 smoke ────────────┘
```

**Nightly** ([`nightly.yml`](.github/workflows/nightly.yml)): full web regression over 3
shards, plus API and k6 (smoke, or `load` on manual dispatch). It then builds an Allure report
with history trends, publishes it to GitHub Pages, and can send a Slack message.

A composite action ([`setup-tests`](.github/actions/setup-tests/action.yml)) caches npm and
the Playwright browser for every job.

## Conventions

| Tag | Meaning |
|---|---|
| `@smoke` / `@regression` | Suite. Smoke runs on every PR; regression runs nightly. |
| `@critical` | Smoke scenario that blocks a release. |
| `@web-cart-05`, `@api-auth-03` … | Unique, stable scenario id, used to link scenarios to defects. |
| `@as-<persona>-user` | Run as a SauceDemo persona other than the default (`@as-problem-user`). |
| `@logged-out` | Start with an empty session. |
| `@known-defect @fail` | Pinned defect: expected to fail until the bug is fixed. |
| `@money`, `@security`, `@performance` | Cross-cutting concern, used for filtering. |

## Adding a test

1. Write the scenario in a `.feature` file under `projects/<product>/<module>/{ui|api}/{smoke|regression}/`.
2. Tag it `@smoke` or `@regression`, a module tag, and a unique id (`@web-cart-05`).
3. Reuse an existing step if one says what you mean. Otherwise, add one in
   `shared/{ui|api}/steps/`. `npm run quality` fails if any step is unimplemented.

## Known defects and lessons learned

[`knowledge-base/known-defects.md`](knowledge-base/known-defects.md) records the four defects
found in the targets, the open questions about their behaviour, and the framework lessons that
each cost a debugging session.

## License

[MIT](LICENSE) © 2026 Chintala Rohith Kumar
