import { createBdd } from 'playwright-bdd';
import { SCHEMAS } from '../schemas';
import { assertJsonSchema } from '../schema.validator';
import { AuthVariant, valueAt } from '../request.client';
import { expect, test } from '../fixtures/api.fixture';

const { When, Then } = createBdd(test);

When('I send a {word} request to {string}', async ({ api, scenario }, method: string, path: string) => {
  scenario.record(await api.send(method, path));
});

When('I send a {word} request to {string} with the {string} header', async ({ api, scenario }, method: string, path: string, auth: string) => {
  scenario.record(await api.send(method, path, auth as AuthVariant));
});

When('I send a {word} request to {string} with body:', async ({ api, scenario }, method: string, path: string, body: string) => {
  scenario.record(await api.send(method, path, 'authorized', JSON.parse(body)));
});

Then('the response status should be {int}', async ({ scenario }, status: number) => {
  const { statusCode, text } = scenario.response;
  expect(statusCode, `body: ${text.slice(0, 300)}`).toBe(status);
});

Then('the response should match the {string} schema', async ({ scenario }, name: string) => {
  const schema = SCHEMAS[name];
  if (!schema) throw new Error(`No schema named "${name}". Known: ${Object.keys(SCHEMAS).join(', ')}.`);
  assertJsonSchema(scenario.response.json, schema, `The "${name}" response`);
});

Then('the response field {string} should be {string}', async ({ scenario }, path: string, expected: string) => {
  expect(String(valueAt(scenario.response.json, path))).toBe(expected);
});

Then('the response should arrive within {int} ms', async ({ scenario }, budget: number) => {
  expect(scenario.response.durationMs).toBeLessThanOrEqual(budget);
});
