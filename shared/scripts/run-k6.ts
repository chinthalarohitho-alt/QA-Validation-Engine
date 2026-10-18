// Runs k6 scripts with this repo's environment injected, and turns each run into Allure results.
//
//   npm run k6 -- <script> [--profile smoke|load|stress] [extra k6 args...]
//   npm run k6:all -- [--profile smoke]
//
// k6 has no `process`, so it cannot import env.config.ts. This runner reads it on the Node side
// and forwards every URL as an `-e` variable, camelCase turned into UPPER_SNAKE
// (loadApiUrl -> __ENV.LOAD_API_URL). A product added to env.config.ts reaches k6 unchanged.

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { CREDENTIALS, current } from '../config/env.config';
import { PROFILE_NAMES } from '../k6/k6.config';
import { writeAllureResults } from './k6-to-allure';

const RESULTS_DIR = 'k6-results';
const ALLURE_DIR = 'allure-results/k6';

function fail(message: string): never {
  console.error(`run-k6: ${message}`);
  process.exit(1);
}

function toEnvKey(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

function findScripts(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findScripts(full);
    return full.includes(`${path.sep}k6${path.sep}`) && entry.name.endsWith('.ts') ? [full] : [];
  });
}

function parseArgs(argv: string[]) {
  const passthrough: string[] = [];
  let script = '';
  let profile = 'smoke';
  let all = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--all') all = true;
    else if (arg === '--profile') profile = argv[++i];
    else if (arg.startsWith('--profile=')) profile = arg.slice('--profile='.length);
    else if (!script && !arg.startsWith('-')) script = arg;
    else passthrough.push(arg);
  }
  return { script, profile, all, passthrough };
}

/** Runs one script; returns whether every threshold held. */
function runOne(script: string, profile: string, passthrough: string[]): boolean {
  const name = path.basename(script, '.ts');
  const summaryFile = path.join(RESULTS_DIR, `${name}.json`);
  const env = {
    ...Object.fromEntries(Object.entries(current).map(([key, value]) => [toEnvKey(key), String(value)])),
    K6_API_TOKEN: CREDENTIALS.loadApiToken,
    K6_PROFILE: profile,
  };

  const args = ['run', '--summary-export', summaryFile, ...Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]), ...passthrough, script];
  console.log(`\n▶ k6 ${name} (profile: ${profile})`);
  const started = Date.now();
  const result = spawnSync('k6', args, { stdio: 'inherit' });

  if (result.error) fail(`could not start k6 — is it installed? (${result.error.message})`);
  if (!fs.existsSync(summaryFile)) fail(`${name} produced no summary; k6 exited with ${result.status}.`);

  writeAllureResults({ summaryFile, script, profile, started, stopped: Date.now(), outputDir: ALLURE_DIR });
  // k6 exits 99 when a threshold is crossed — a test failure, not a crash.
  return result.status === 0;
}

function main(): void {
  const { script, profile, all, passthrough } = parseArgs(process.argv.slice(2));
  if (!PROFILE_NAMES.includes(profile as never)) fail(`unknown profile "${profile}". Expected one of: ${PROFILE_NAMES.join(', ')}.`);

  const scripts = all ? findScripts('projects') : [script];
  if (!scripts[0]) fail('name a script, or pass --all.\n  npm run k6 -- projects/<product>/<module>/k6/<script>.ts --profile smoke');
  for (const s of scripts) if (!fs.existsSync(s)) fail(`no such script: ${s}`);

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  // Run every script even after a failure, so one breach does not hide the others.
  const failed = scripts.filter((s) => !runOne(s, profile, passthrough));
  if (failed.length) fail(`thresholds crossed in: ${failed.map((s) => path.basename(s)).join(', ')}`);
}

main();
