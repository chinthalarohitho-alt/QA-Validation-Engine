# Known defects

Every defect here is pinned by a scenario tagged `@known-defect @fail`. Playwright runs it
expecting failure, so:

- while the defect exists, the build stays **green** and the report still shows the failure message;
- the day it is fixed, the scenario **passes unexpectedly and turns the build red** — the signal to
  remove the `@fail` tag and turn the scenario into an ordinary regression check.

A known defect can therefore never outlive its bug unnoticed, and a fixed bug can never quietly
regress.

**Limitation.** `@fail` accepts *any* failure, not only the documented one. If a pinned scenario
starts failing for a different reason (the target is down, a locator changed), it stays green.
The ordinary scenarios covering the same pages catch those cases, so review a `@fail` scenario
whenever its failure message in the report changes.

| ID | Area | Defect | Pinned by |
|---|---|---|---|
| KD-01 | Web · Login | `performance_glitch_user` takes ~5 s to reach the products page (budget: 2 s). | `@web-login-05` |
| KD-02 | Web · Products | Sorting has no effect for `problem_user`. | `@web-inv-04` |
| KD-03 | Web · Products | Every product shows the same image for `problem_user`. | `@web-inv-05` |
| KD-04 | API · Auth | A real token with an altered signature answers **500** `{"message":"invalid signature"}` instead of **401**. A server error on a forged credential is both wrong and a signal to an attacker. | `@api-auth-05` |

## Open questions

Behaviour that looks surprising but is not proven wrong. Tests assert what the service does and
the question stays here until someone who owns the spec answers it.

| ID | Area | Observation |
|---|---|---|
| Q-01 | Load · Recommendations | `maxCaloriesPerSlice` caps the **ingredients'** calories only. Dough calories are added on top, so a pizza can exceed the requested maximum by up to 300 kcal/slice. The k6 check asserts the ingredient-only rule. |

## Framework lessons found while building this

Recorded because each one cost a debugging session, and would cost the next person one too.

- **`/auth/login` sets a cookie as well as returning a token.** A worker-shared API context kept the
  cookie, and every "no token" request was silently authenticated by it — the route guard looked
  broken. Fixed by giving each scenario its own request context (`shared/api/fixtures/api.fixture.ts`).
- **A JWT-shaped string and a non-JWT string take different server paths.** `not.a.real.token`
  (four parts) is rejected with 401; any three-part token reaches signature verification and hits
  KD-04. The auth matrix tests both.
- **Session reuse must follow the cookie's expiry, not the file's age.** SauceDemo's session lives
  ~10 minutes; reusing a "recent" state made every scenario fail at the products page.
- **Read a list only after the navigation that shows it has finished.** Reading the cart while
  the products page was still mounted paired names with the wrong prices. Waiting for the URL was
  not enough — the router changes it before the old page unmounts — so page objects now wait for
  the destination page's own title (`shared/ui/pages/navigation.ts`).
- **Natural sort order.** The products API sorts titles case-insensitively with numeric
  awareness ("S7" before "S10"); a plain string sort calls a correct server wrong.
