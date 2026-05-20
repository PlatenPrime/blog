/**
 * Local smoke: TypeORM migrate up → show → revert → up.
 * Requires Postgres (`npm run db:up`) and root `.env` (or POSTGRES_* defaults via CLI env loader).
 *
 * On a dirty DB: `npm run db:reset && npm run db:up` before re-running.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args, { label } = {}) {
  const name = label ?? [command, ...args].join(' ');
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`${name}: failed (exit ${result.status ?? 'unknown'})`);
    process.exit(result.status ?? 1);
  }
  console.log(`${name}: OK`);
}

function pgReady() {
  const result = spawnSync(
    'docker',
    ['compose', 'exec', '-T', 'db', 'pg_isready', '-U', 'blog'],
    {
      cwd: repoRoot,
      stdio: 'pipe',
      shell: process.platform === 'win32',
    },
  );
  if (result.status !== 0) {
    console.error(
      'Postgres is not ready. Run `npm run db:up` and wait for a healthy db container.',
    );
    process.exit(1);
  }
  console.log('postgres: OK (pg_isready)');
}

pgReady();

run('npm', ['run', 'db:migrate'], { label: 'db:migrate' });

const show = spawnSync('npm', ['run', 'db:migrate:show'], {
  cwd: repoRoot,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
if (show.status !== 0) {
  console.error('db:migrate:show: failed');
  process.exit(show.status ?? 1);
}
const showOut = `${show.stdout ?? ''}${show.stderr ?? ''}`;
if (!showOut.includes('InitialBaseline')) {
  console.error(
    'db:migrate:show: expected InitialBaseline migration in output',
  );
  process.exit(1);
}
console.log('db:migrate:show: OK (InitialBaseline listed)');

run('npm', ['run', 'db:migrate:revert'], { label: 'db:migrate:revert' });
run('npm', ['run', 'db:migrate'], { label: 'db:migrate (re-apply)' });

console.log('migration-smoke: all checks passed');
