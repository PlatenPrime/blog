/* global process */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const childEnv = { ...process.env };
delete childEnv.FORCE_COLOR;
delete childEnv.NO_COLOR;
childEnv.NODE_NO_WARNINGS = '1';

const HEAP_FLAG = '--max-old-space-size=4096';
if (!childEnv.NODE_OPTIONS?.includes('max-old-space-size')) {
  childEnv.NODE_OPTIONS = childEnv.NODE_OPTIONS
    ? `${childEnv.NODE_OPTIONS} ${HEAP_FLAG}`
    : HEAP_FLAG;
}

/**
 * Avoid `npm run` inside Git hooks: some environments (WSL relay / minimal images)
 * invoke bash for npm lifecycle scripts and fail when `/bin/bash` is missing.
 */
function runNode(scriptRelativePath, extraArgs = []) {
  const scriptPath = path.join(repoRoot, scriptRelativePath);
  const result = spawnSync(process.execPath, [scriptPath, ...extraArgs], {
    cwd: repoRoot,
    env: childEnv,
    stdio: 'inherit',
  });

  const code = result.status ?? 1;
  if (code !== 0) {
    process.exit(code);
  }
}

runNode('scripts/validate-tests-first.mjs');
runNode(path.join('node_modules', 'lint-staged', 'bin', 'lint-staged.js'), [
  '--concurrent=false',
  '--relative',
]);
