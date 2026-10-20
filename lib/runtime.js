import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Engine } from '../engine.js';
import { createApi } from './api.js';

// Keep the SQLite connection and demo sessions across Next.js development reloads.
// This local app intentionally runs in one Node process, not an edge runtime.
const runtimeKey = Symbol.for('chainguard.local.runtime');
export function getApi() {
  if (!globalThis[runtimeKey]) {
    const path = process.env.CHAINGUARD_DB_PATH || join(process.cwd(), 'data', 'chainguard.sqlite');
    mkdirSync(dirname(path), { recursive: true });
    const engine = new Engine(path);
    globalThis[runtimeKey] = { engine, handle: createApi(engine) };
  }
  return globalThis[runtimeKey].handle;
}
