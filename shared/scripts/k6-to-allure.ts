// Turns a k6 `--summary-export` file into Allure results, so load tests sit in the same report
// as the functional ones instead of in a terminal log nobody keeps.
//
// One Allure test per THRESHOLD and one per CHECK: a threshold is a pass/fail rule a reviewer
// can read ("p(95) of POST /api/pizza < 1500 ms"), and a check is a correctness rule held under
// load. In the summary-export format a threshold's value is `true` when it was CROSSED.

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface Metric { thresholds?: Record<string, boolean>; [stat: string]: unknown }
interface CheckResult { name: string; passes: number; fails: number }
interface Group { name: string; groups: Record<string, Group>; checks: Record<string, CheckResult> }
interface Summary { metrics: Record<string, Metric>; root_group: Group }

export interface ConvertOptions {
  summaryFile: string;
  script: string;
  profile: string;
  started: number;
  stopped: number;
  outputDir: string;
}

function collectChecks(group: Group, prefix = ''): CheckResult[] {
  const label = group.name ? `${prefix}${group.name} › ` : prefix;
  return [
    ...Object.values(group.checks).map((c) => ({ ...c, name: `${label}${c.name}` })),
    ...Object.values(group.groups).flatMap((g) => collectChecks(g, label)),
  ];
}

/** "p(95)" -> the measured p(95); "rate" -> value; "count" -> count. */
function observed(metric: Metric, expression: string): string {
  const stat = expression.match(/^[a-z]+(\(\d+(\.\d+)?\))?/)?.[0] ?? '';
  const value = stat === 'rate' ? metric.value : metric[stat];
  return typeof value === 'number' ? (Number.isInteger(value) ? String(value) : value.toFixed(stat === 'rate' ? 4 : 1)) : 'n/a';
}

export function writeAllureResults(options: ConvertOptions): void {
  const summary: Summary = JSON.parse(fs.readFileSync(options.summaryFile, 'utf8'));
  const scriptName = path.basename(options.script, '.ts');
  const product = options.script.split(path.sep)[1] ?? 'load';
  fs.mkdirSync(options.outputDir, { recursive: true });

  const write = (name: string, subSuite: string, passed: boolean, details: string) => {
    const fullName = `${scriptName}#${name}`;
    const result = {
      uuid: crypto.randomUUID(),
      historyId: crypto.createHash('md5').update(fullName).digest('hex'),
      fullName,
      name,
      status: passed ? 'passed' : 'failed',
      statusDetails: passed ? {} : { message: details },
      stage: 'finished',
      start: options.started,
      stop: options.stopped,
      labels: [
        { name: 'parentSuite', value: 'Load (k6)' },
        { name: 'suite', value: `${product} › ${scriptName}` },
        { name: 'subSuite', value: subSuite },
        { name: 'tag', value: `profile:${options.profile}` },
        { name: 'framework', value: 'k6' },
      ],
      parameters: [{ name: 'profile', value: options.profile }],
      description: details,
    };
    fs.writeFileSync(path.join(options.outputDir, `${result.uuid}-result.json`), JSON.stringify(result, null, 2));
  };

  for (const [metricName, metric] of Object.entries(summary.metrics)) {
    for (const [expression, crossed] of Object.entries(metric.thresholds ?? {})) {
      write(`${metricName}: ${expression}`, 'Thresholds', !crossed,
        `Threshold ${expression} on ${metricName} — observed ${observed(metric, expression)}.`);
    }
  }

  for (const check of collectChecks(summary.root_group)) {
    write(check.name, 'Checks under load', check.fails === 0,
      `${check.passes} passed, ${check.fails} failed of ${check.passes + check.fails} iterations.`);
  }
}
