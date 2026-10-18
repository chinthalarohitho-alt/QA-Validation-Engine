/**
 * The HTTP transport for the API lane.
 *
 * Built on Playwright's own `APIRequestContext`, so the API lane shares the web lane's runner,
 * reporter, retries config and CI sharding — one toolchain, not two.
 *
 * Nothing in this file asserts. A `Then` step owns every `expect`, exactly as in the UI lane;
 * this only sends requests and hands back what came back.
 */
import { APIRequestContext } from '@playwright/test';

export interface ApiResponse {
  readonly statusCode: number;
  /** Parsed body, or undefined when the response was not JSON. */
  readonly json: any;
  /** The raw body, kept so a failure can quote what the server actually said. */
  readonly text: string;
  readonly durationMs: number;
}

/**
 * How a request authenticates. Each is a distinct code path on the server: no header at all,
 * an empty header, something that is not a JWT, a real JWT whose signature was altered, and a
 * valid token.
 */
export const AUTH_VARIANTS = ['authorized', 'no-token', 'blank-token', 'malformed-token', 'tampered-token'] as const;
export type AuthVariant = (typeof AUTH_VARIANTS)[number];

export class ApiClient {
  constructor(private readonly context: APIRequestContext, private readonly token: string) {}

  private headersFor(auth: AuthVariant): Record<string, string> {
    switch (auth) {
      case 'authorized': return { Authorization: `Bearer ${this.token}` };
      case 'no-token': return {};
      case 'blank-token': return { Authorization: '' };
      case 'malformed-token': return { Authorization: 'Bearer not.a.real.token' };
      // The worker's own token with its signature replaced: the header and payload still parse,
      // so this reaches signature verification, which a malformed string never does.
      case 'tampered-token': return { Authorization: `Bearer ${this.token.replace(/\.[^.]+$/, '.' + 'A'.repeat(43))}` };
    }
  }

  async send(method: string, path: string, auth: AuthVariant = 'authorized', body?: unknown): Promise<ApiResponse> {
    if (!AUTH_VARIANTS.includes(auth)) throw new Error(`Unknown auth variant "${auth}". Expected one of: ${AUTH_VARIANTS.join(', ')}.`);

    const started = Date.now();
    const response = await this.context.fetch(path, {
      method: method.toUpperCase(),
      headers: this.headersFor(auth),
      data: body,
    });
    const durationMs = Date.now() - started;
    const text = await response.text();

    let json: unknown;
    try { json = text ? JSON.parse(text) : undefined; } catch { json = undefined; }

    return { statusCode: response.status(), json, text, durationMs };
  }
}

/** Reads `a.b.0.c` out of a body — for steps that name a field by path. */
export function valueAt(body: unknown, path: string): unknown {
  return path.split('.').reduce<any>((node, key) => (node == null ? undefined : node[key]), body);
}
