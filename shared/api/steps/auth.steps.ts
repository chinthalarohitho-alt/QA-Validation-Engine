import { createBdd } from 'playwright-bdd';
import { CREDENTIALS } from '../../config/env.config';
import { expect, test } from '../fixtures/api.fixture';

const { When, Then } = createBdd(test);

When('I sign in to the API with the configured account', async ({ api, scenario }) => {
  scenario.record(await api.send('POST', '/auth/login', 'no-token', {
    username: CREDENTIALS.apiUsername,
    password: CREDENTIALS.apiPassword,
  }));
});

When('I sign in to the API as {string} with password {string}', async ({ api, scenario }, username: string, password: string) => {
  const body: Record<string, string> = {};
  if (username) body.username = username;
  if (password) body.password = password;
  scenario.record(await api.send('POST', '/auth/login', 'no-token', body));
});

Then('the token should identify the configured account', async ({ scenario }) => {
  // Decoding the JWT payload rather than trusting the response's own `username` field: the
  // token is what every later request presents, so it is the token that must be right.
  const payload = JSON.parse(Buffer.from(scenario.response.json.accessToken.split('.')[1], 'base64url').toString());
  expect(payload.username).toBe(CREDENTIALS.apiUsername);
  expect(payload.exp, 'token must expire').toBeGreaterThan(Math.floor(Date.now() / 1000));
});
