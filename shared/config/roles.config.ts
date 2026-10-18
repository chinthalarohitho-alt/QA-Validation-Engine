import path from 'path';
import { CURRENT_ENV } from './env.config';

/**
 * The personas a web scenario can run as, chosen by tag.
 *
 * SauceDemo ships one account per behaviour — a healthy user, one with seeded UI defects, a
 * slow one — which maps directly onto how a real product is tested per role. A scenario tagged
 * `@as-problem-user` runs as `problem_user`; an untagged one runs as the default persona.
 *
 * `anonymous` is the persona for the login feature itself: an empty storage state, so the
 * scenario starts signed out.
 */
export const ROLES = {
  standard: 'standard_user',
  problem: 'problem_user',
  performance: 'performance_glitch_user',
  error: 'error_user',
  visual: 'visual_user',
} as const;

export type RoleName = keyof typeof ROLES | 'anonymous';

export const DEFAULT_ROLE: RoleName = 'standard';

/** SauceDemo's locked-out account. Never signed in by globalSetup — it cannot be. */
export const LOCKED_OUT_USER = 'locked_out_user';

const TAG_PREFIX = '@as-';

/** `@as-problem-user` -> `problem`; `@logged-out` -> `anonymous`; nothing -> the default. */
export function roleFromTags(tags: readonly string[]): RoleName {
  if (tags.includes('@logged-out')) return 'anonymous';

  const tag = tags.find((t) => t.startsWith(TAG_PREFIX));
  if (!tag) return DEFAULT_ROLE;

  const role = tag.slice(TAG_PREFIX.length).replace(/-user$/, '');
  if (!(role in ROLES)) {
    // A typo in a tag must fail, not silently run the scenario as the default persona and
    // "pass" a permission check it never exercised.
    throw new Error(`Unknown persona tag "${tag}". Expected one of: ${Object.keys(ROLES).map((r) => `${TAG_PREFIX}${r}-user`).join(', ')}.`);
  }
  return role as RoleName;
}

const EMPTY_STATE = { cookies: [], origins: [] };

/** Where a persona's signed-in state lives — per environment, so two envs never share one. */
export function stateFileFor(role: RoleName): string | typeof EMPTY_STATE {
  if (role === 'anonymous') return EMPTY_STATE;
  return path.join('.auth', CURRENT_ENV, `${role}.json`);
}
