import { APIRequestContext } from '@playwright/test';
import { CREDENTIALS } from '../config/env.config';

/**
 * Mints a bearer token for the configured API account.
 *
 * Called once per worker by the `apiConnection` fixture, not per scenario: a token is minted
 * over the network, and a login regression should fail the auth feature, not every scenario.
 */
export async function mintToken(context: APIRequestContext): Promise<string> {
  const response = await context.post('/auth/login', {
    data: { username: CREDENTIALS.apiUsername, password: CREDENTIALS.apiPassword, expiresInMins: 60 },
  });
  if (!response.ok()) {
    throw new Error(`API sign-in failed with ${response.status()}: ${await response.text()}`);
  }
  const { accessToken } = await response.json();
  if (!accessToken) throw new Error('API sign-in succeeded but returned no accessToken.');
  return accessToken;
}
