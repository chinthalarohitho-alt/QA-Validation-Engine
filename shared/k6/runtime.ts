// k6-side environment access. Loaded only by k6 — never by Node.
//
// Values arrive from `shared/scripts/run-k6.ts`, which reads `shared/config/env.config.ts` on the
// Node side and injects each one with `-e`. k6 cannot import that file: it has no `process`.

import { K6_DEFAULTS, PROFILE_NAMES, ProfileName } from './k6.config.ts';

/**
 * A runner-injected value, or a stated failure.
 *
 * `k6 run <script>` directly skips the runner and leaves every host undefined; the script would
 * then request `undefined/api/...` and fail as a flood of connection errors that look like the
 * target being down. This names the real cause instead.
 */
export function requireEnv(name: string): string {
  const value = __ENV[name];
  if (!value) {
    throw new Error(`__ENV.${name} is not set. Run k6 scripts through the runner:\n  npm run k6 -- <script> --profile smoke`);
  }
  return value;
}

export function currentProfile(): ProfileName {
  const profile = (__ENV.K6_PROFILE || 'smoke') as ProfileName;
  if (!(profile in K6_DEFAULTS.stages)) {
    throw new Error(`Unknown k6 profile "${profile}". Expected one of: ${PROFILE_NAMES.join(', ')}.`);
  }
  return profile;
}

export function loadApiUrl(): string {
  return requireEnv('LOAD_API_URL');
}

/** QuickPizza authenticates every call with `Authorization: token <value>`. */
export function authHeaders(): Record<string, string> {
  return { Authorization: `token ${requireEnv('K6_API_TOKEN')}`, 'Content-Type': 'application/json' };
}
