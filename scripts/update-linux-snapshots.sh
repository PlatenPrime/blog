#!/usr/bin/env bash
set -euo pipefail

echo "==> syncing sources (excluding node_modules/.next/.git)"
mkdir -p /tmp/app
tar -C /host \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=playwright-report \
  --exclude=test-results \
  --exclude=media \
  --exclude=coverage \
  -cf - . | tar -C /tmp/app -xf -
cd /tmp/app

echo "==> npm ci"
npm ci

echo "==> playwright chromium + system deps"
npx playwright install --with-deps chromium

echo "==> migrate"
npm run migrate

echo "==> update linux snapshots (home + public-site)"
npm run test:e2e -- home.e2e public-site.e2e --update-snapshots

echo "==> copy linux pngs back to host"
mkdir -p \
  /host/tests/e2e/home.e2e.spec.ts-snapshots \
  /host/tests/e2e/public-site.e2e.spec.ts-snapshots

cp -a tests/e2e/home.e2e.spec.ts-snapshots/*-linux.png \
  /host/tests/e2e/home.e2e.spec.ts-snapshots/
cp -a tests/e2e/public-site.e2e.spec.ts-snapshots/*-linux.png \
  /host/tests/e2e/public-site.e2e.spec.ts-snapshots/

ls -la /host/tests/e2e/home.e2e.spec.ts-snapshots/
ls -la /host/tests/e2e/public-site.e2e.spec.ts-snapshots/
echo "==> done"
