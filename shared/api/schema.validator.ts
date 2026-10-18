/**
 * JSON Schema validation for the API lane — the one place ajv is used.
 *
 * A schema belongs in `schemas/`; an assertion about one belongs in a `Then` step that calls this.
 */
import Ajv from 'ajv';

/**
 * `allErrors` because a shape that drifted usually drifted in more than one field, and reporting
 * only the first turns one fix into three runs. `strict: false` because the schemas describe only
 * the fields a test depends on, not the whole payload.
 */
const ajv = new Ajv({ allErrors: true, strict: false });

const compiled = new WeakMap<object, ReturnType<typeof ajv.compile>>();

/**
 * Throws unless `body` matches `schema`, naming every failing field and quoting the body.
 *
 * The body is quoted because the usual failure is not a renamed field but a different payload
 * altogether — an error envelope where a result was expected.
 */
export function assertJsonSchema(body: unknown, schema: object, label: string): void {
  let validate = compiled.get(schema);
  if (!validate) {
    validate = ajv.compile(schema);
    compiled.set(schema, validate);
  }
  if (validate(body)) return;

  const failures = (validate.errors ?? []).map((e) => `${e.instancePath || '(root)'} ${e.message}`).join('; ');
  throw new Error(`${label} did not match its schema: ${failures}\n  body: ${JSON.stringify(body).slice(0, 400)}`);
}
