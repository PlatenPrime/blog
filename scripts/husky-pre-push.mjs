/* global process */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const nxBin = path.join(repoRoot, 'node_modules', 'nx', 'dist', 'bin', 'nx.js');

const childEnv = { ...process.env };
delete childEnv.FORCE_COLOR;
delete childEnv.NO_COLOR;
childEnv.NODE_NO_WARNINGS = '1';

/** Vitest/ESLint typecheck graphs can OOM on default heap during git hooks (Windows). */
const HEAP_FLAG = '--max-old-space-size=4096';
if (!childEnv.NODE_OPTIONS?.includes('max-old-space-size')) {
  childEnv.NODE_OPTIONS = childEnv.NODE_OPTIONS
    ? `${childEnv.NODE_OPTIONS} ${HEAP_FLAG}`
    : HEAP_FLAG;
}

const result = spawnSync(
  process.execPath,
  [
    nxBin,
    'affected',
    '-t',
    'lint,test',
    '--parallel=1',
    '--base=HEAD~1',
    '--head=HEAD',
    '--skipNxCache',
  ],
  {
    cwd: repoRoot,
    env: childEnv,
    stdio: 'inherit',
  },
);

process.exit(result.status ?? 1);
