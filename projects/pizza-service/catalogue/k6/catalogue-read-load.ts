// Load test for the read-only catalogue a client fetches on start-up. Safe to run anywhere.

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { stagesFor, thresholdsFor } from '../../../../shared/k6/k6.config.ts';
import { authHeaders, currentProfile, loadApiUrl } from '../../../../shared/k6/runtime.ts';

const READS = {
  'GET /api/doughs': { path: '/api/doughs', key: 'doughs' },
  'GET /api/tools': { path: '/api/tools', key: 'tools' },
  'GET /api/names': { path: '/api/names', key: 'names' },
  'GET /api/quotes': { path: '/api/quotes', key: 'quotes' },
} as const;

export const options = {
  stages: stagesFor(currentProfile()),
  thresholds: thresholdsFor(Object.fromEntries(Object.keys(READS).map((name) => [name, 800]))),
};

export default function () {
  group('app start-up', () => {
    const responses = http.batch(Object.entries(READS).map(([name, { path }]) => ({
      method: 'GET',
      url: `${loadApiUrl()}${path}`,
      params: { headers: authHeaders(), tags: { name } },
    })));

    Object.values(READS).forEach(({ key }, i) => {
      check(responses[i], {
        [`${key}: status is 200`]: (r) => r.status === 200,
        [`${key}: list is not empty`]: (r) => r.status === 200 && ((r.json(key) as unknown[] | null)?.length ?? 0) > 0,
      });
    });
  });

  sleep(1);
}
