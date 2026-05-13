/* global process, console */
import { execSync } from 'node:child_process';

const normalizePath = (value) => value.replaceAll('\\', '/').trim();

const stagedFilesFromArgs = process.argv
  .slice(2)
  .map(normalizePath)
  .filter(Boolean);

const fallbackStagedFiles = () => {
  const raw = execSync('git diff --cached --name-only --diff-filter=ACMR', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  return raw.split(/\r?\n/).map(normalizePath).filter(Boolean);
};

const uniqueFiles = Array.from(
  new Set(
    (stagedFilesFromArgs.length > 0
      ? stagedFilesFromArgs
      : fallbackStagedFiles()
    ).filter(
      (filePath) =>
        filePath.startsWith('apps/') ||
        filePath.startsWith('libs/') ||
        filePath.startsWith('package.json') ||
        filePath.startsWith('nx.json') ||
        filePath.startsWith('tsconfig'),
    ),
  ),
);

if (uniqueFiles.length === 0) {
  process.exit(0);
}

const filesArg = uniqueFiles.join(',');
const childEnv = { ...process.env, npm_config_color: 'false' };
delete childEnv.FORCE_COLOR;
delete childEnv.NO_COLOR;

console.log(`Running affected tests for ${uniqueFiles.length} staged file(s).`);
execSync(`npx nx affected -t test --files="${filesArg}" --skipNxCache`, {
  stdio: 'inherit',
  env: childEnv,
});
