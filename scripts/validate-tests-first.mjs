/* global console, process */
import { execSync } from 'node:child_process';

const normalizePath = (p) => p.replaceAll('\\', '/');

const getGitDiffFiles = (command) => {
  const raw = execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizePath);
};

const getStagedFiles = () =>
  getGitDiffFiles('git diff --cached --name-only --diff-filter=ACMR');

const getArgValue = (name) => {
  const arg = process.argv.find((item) => item.startsWith(`${name}=`));
  return arg ? arg.slice(name.length + 1) : '';
};

const isAllZerosSha = (sha) => /^0+$/.test(sha);

const resolveCiRange = () => {
  const explicitRange = getArgValue('--range');
  if (explicitRange) return explicitRange;

  const eventName = process.env.GITHUB_EVENT_NAME ?? '';
  const baseRef = process.env.GITHUB_BASE_REF ?? '';
  const beforeSha = process.env.BEFORE_SHA ?? '';
  const headSha = process.env.GITHUB_SHA ?? 'HEAD';

  if (eventName === 'pull_request' && baseRef) {
    return `origin/${baseRef}...${headSha}`;
  }

  if (beforeSha && !isAllZerosSha(beforeSha) && headSha) {
    return `${beforeSha}...${headSha}`;
  }

  return 'HEAD~1...HEAD';
};

const getCiFiles = () => {
  const range = resolveCiRange();
  return getGitDiffFiles(`git diff --name-only --diff-filter=ACMR ${range}`);
};

const isApiUnitTestFile = (filePath) => {
  // For this repo jest unit tests follow the `*.spec.ts` naming.
  return (
    filePath.startsWith('apps/api/') &&
    (filePath.endsWith('.spec.ts') || filePath.endsWith('.test.ts'))
  );
};

const isApiProductionFile = (filePath) => {
  // Only enforce for production code. Tests under `apps/api/` are excluded.
  return filePath.startsWith('apps/api/src/') && !isApiUnitTestFile(filePath);
};

const webUnitTestRegex = /\/.+\.(spec|test)\.(ts|tsx|js|jsx)$/i;

const isWebUnitTestFile = (filePath) => {
  return filePath.startsWith('apps/web/') && webUnitTestRegex.test(filePath);
};

const isWebProductionFile = (filePath) => {
  // Enforce only for production code under `apps/web/src`.
  return filePath.startsWith('apps/web/src/') && !isWebUnitTestFile(filePath);
};

const ciMode = process.argv.includes('--ci');
const filesToCheck = ciMode ? getCiFiles() : getStagedFiles();
const diffSourceLabel = ciMode ? 'diff-range' : 'staged';

if (filesToCheck.length === 0) {
  process.exit(0);
}

const apiProductionChanged = filesToCheck.some(isApiProductionFile);
const apiUnitTestChanged = filesToCheck.some(isApiUnitTestFile);

const webProductionChanged = filesToCheck.some(isWebProductionFile);
const webUnitTestChanged = filesToCheck.some(isWebUnitTestFile);

const failures = [];

if (apiProductionChanged && !apiUnitTestChanged) {
  const changedApiFiles = filesToCheck.filter(isApiProductionFile);
  failures.push({
    area: 'apps/api (unit tests are required)',
    changed: changedApiFiles,
    message:
      'При изменении production-кода `apps/api/src` в commit должны быть unit-тесты (`*.spec.ts` / `*.test.ts`). Добавьте или обновите тесты и повторите коммит.',
  });
}

if (webProductionChanged && !webUnitTestChanged) {
  const changedWebFiles = filesToCheck.filter(isWebProductionFile);
  failures.push({
    area: 'apps/web (unit tests are required)',
    changed: changedWebFiles,
    message:
      'При изменении production-кода `apps/web/src` в commit должны быть unit-тесты (`*.spec.*` / `*.test.*`). Добавьте или обновите тесты и повторите коммит.',
  });
}

if (failures.length > 0) {
  console.error('\nTests-first (TDD) pre-commit check failed.\n');
  for (const failure of failures) {
    console.error(`${failure.message}`);
    console.error(`Source: ${diffSourceLabel}; area: ${failure.area}.`);
    console.error('Изменённые production-файлы:');
    for (const f of failure.changed.slice(0, 20)) {
      console.error(`- ${f}`);
    }
    if (failure.changed.length > 20) {
      console.error(`- ... и ещё ${failure.changed.length - 20} файлов`);
    }
    console.error('');
  }
  console.error(
    'Убедитесь, что unit-тесты попали в тот же commit (т.е. они должны быть staged тоже).\n',
  );
  process.exit(1);
}

process.exit(0);
