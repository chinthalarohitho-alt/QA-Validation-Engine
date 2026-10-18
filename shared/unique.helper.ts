/**
 * A suffix that is unique across workers, shards and runs.
 *
 * Worker indexes restart at 0 in every CI shard, so the worker index alone collides between
 * shards; SHARD_INDEX is added by the workflow to keep generated data apart.
 */
let counter = 0;

export function uniqueSuffix(): string {
  const shard = process.env.SHARD_INDEX ?? '0';
  const worker = process.env.TEST_PARALLEL_INDEX ?? '0';
  counter += 1;
  return `${Date.now().toString(36)}${shard}${worker}${counter}`;
}
