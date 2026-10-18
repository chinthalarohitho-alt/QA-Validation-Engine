// Load profiles and default thresholds, shared by every k6 script.
//
// Read from BOTH runtimes — k6 scripts import it, and so does the Node-side runner to validate
// a profile name — so it must stay free of k6's `__ENV` global. Anything reading `__ENV`
// belongs in `runtime.ts`, which only k6 loads.

export const K6_DEFAULTS = {
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
  stages: {
    // A few users for half a minute: proves the script and the thresholds, on every PR.
    smoke: [{ duration: '30s', target: 3 }],
    load: [
      { duration: '30s', target: 20 },
      { duration: '2m', target: 20 },
      { duration: '30s', target: 0 },
    ],
    stress: [
      { duration: '1m', target: 50 },
      { duration: '3m', target: 50 },
      { duration: '1m', target: 0 },
    ],
  },
} as const;

export type ProfileName = keyof typeof K6_DEFAULTS.stages;

export const PROFILE_NAMES = Object.keys(K6_DEFAULTS.stages) as ProfileName[];

/** A profile's stages as a mutable array — `K6_DEFAULTS` is readonly and `options` is not. */
export function stagesFor(profile: ProfileName): Array<{ duration: string; target: number }> {
  return K6_DEFAULTS.stages[profile].map((stage) => ({ ...stage }));
}

/**
 * The default thresholds plus a p95 budget per named request.
 *
 * Per request, not one global p95: a slow write hidden inside an average of fast reads is the
 * exact regression a load test exists to catch.
 */
export function thresholdsFor(budgets: Record<string, number>): Record<string, string[]> {
  const thresholds: Record<string, string[]> = {
    http_req_failed: [...K6_DEFAULTS.thresholds.http_req_failed],
    checks: [...K6_DEFAULTS.thresholds.checks],
  };
  for (const [name, p95] of Object.entries(budgets)) {
    thresholds[`http_req_duration{name:${name}}`] = [`p(95)<${p95}`];
  }
  return thresholds;
}
