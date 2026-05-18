/**
 * SIGTERM graceful shutdown smoke: spawns built API, checks /health, sends SIGTERM.
 *
 * Prerequisite: npx nx run api:build
 *
 * Env:
 *   SMOKE_PORT — listen port (default 4099; child always gets PORT=<this value>)
 */

import { fork, spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHUTDOWN_LOG_MARKER = 'application shutdown';
const DEFAULT_SMOKE_PORT = 4099;
/** Nest shutdown hooks are reliable with SIGTERM on Unix; Windows subprocesses use IPC. */
const SHUTDOWN_SIGNAL = 'SIGTERM';
const GRACEFUL_SHUTDOWN_IPC_MESSAGE = 'graceful-shutdown';
const useIpcShutdown = process.platform === 'win32';
const HEALTH_POLL_MS = 250;
const HEALTH_TIMEOUT_MS = 15_000;
const EXIT_TIMEOUT_MS = 10_000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const mainJs = path.join(repoRoot, 'apps/api/dist/main.js');

function resolveSmokePort() {
  const raw = process.env.SMOKE_PORT ?? String(DEFAULT_SMOKE_PORT);
  const port = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid smoke port: ${raw}`);
  }
  return port;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(port) {
  const url = `http://127.0.0.1:${port}/health`;
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (res.ok) {
        return;
      }
    } catch {
      // retry until deadline
    } finally {
      clearTimeout(timer);
    }
    await sleep(HEALTH_POLL_MS);
  }

  throw new Error(
    `API did not become healthy at ${url} within ${HEALTH_TIMEOUT_MS}ms`,
  );
}

function attachOutputCollectors(child, combinedOutput) {
  child.stdout?.on('data', (chunk) => {
    combinedOutput.push(chunk.toString());
  });
  child.stderr?.on('data', (chunk) => {
    combinedOutput.push(chunk.toString());
  });
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `Process did not exit within ${EXIT_TIMEOUT_MS}ms after SIGTERM`,
        ),
      );
    }, EXIT_TIMEOUT_MS);

    child.on('exit', (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal });
    });
  });
}

async function main() {
  try {
    await access(mainJs);
  } catch {
    console.error(`Missing ${mainJs}. Run: npx nx run api:build`);
    process.exit(1);
  }

  const port = resolveSmokePort();
  const combinedOutput = [];

  const child = useIpcShutdown
    ? fork(mainJs, {
        cwd: repoRoot,
        env: { ...process.env, PORT: String(port) },
        silent: true,
      })
    : spawn(process.execPath, [mainJs], {
        cwd: repoRoot,
        env: { ...process.env, PORT: String(port) },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
  attachOutputCollectors(child, combinedOutput);

  let failed = false;

  try {
    await waitForHealth(port);
    console.log(`api: healthy on port ${port}`);

    if (useIpcShutdown) {
      child.send(GRACEFUL_SHUTDOWN_IPC_MESSAGE);
      console.log(`api: sent IPC ${GRACEFUL_SHUTDOWN_IPC_MESSAGE}`);
    } else {
      child.kill(SHUTDOWN_SIGNAL);
      console.log(`api: sent ${SHUTDOWN_SIGNAL}`);
    }

    const { code, signal } = await waitForExit(child);
    const output = combinedOutput.join('');
    const hasShutdownLog = output.includes(SHUTDOWN_LOG_MARKER);
    const exitedCleanly = code === 0;

    if (!exitedCleanly && !hasShutdownLog) {
      const trigger = useIpcShutdown
        ? `IPC ${GRACEFUL_SHUTDOWN_IPC_MESSAGE}`
        : SHUTDOWN_SIGNAL;
      console.error(
        `api: exited with code ${code ?? 'null'} (signal ${signal ?? 'none'}) after ${trigger}`,
      );
      failed = true;
    } else {
      const trigger = useIpcShutdown
        ? `IPC ${GRACEFUL_SHUTDOWN_IPC_MESSAGE}`
        : SHUTDOWN_SIGNAL;
      console.log(
        `api: shutdown complete after ${trigger} (code=${code ?? 'null'}, signal=${signal ?? 'none'})`,
      );
    }

    if (!hasShutdownLog) {
      console.error(
        `api: stdout/stderr missing shutdown log marker "${SHUTDOWN_LOG_MARKER}"`,
      );
      failed = true;
    } else {
      console.log('api: shutdown log marker present');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`shutdown-smoke: ${msg}`);
    failed = true;
  } finally {
    if (child.exitCode === null && !child.killed) {
      child.kill('SIGKILL');
    }
  }

  process.exit(failed ? 1 : 0);
}

void main();
