import { spawn } from 'node:child_process';
import process from 'node:process';

const port = Number(process.env.SMOKE_PORT || 4173);
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 45000);
const startAt = Date.now();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(url, timeout) {
  while (Date.now() - startAt < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Wait for server to come up.
    }
    await sleep(800);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

const startCommand = process.platform === 'win32' ? 'npm run start' : 'npm run start';
const server = spawn(startCommand, {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
  },
  shell: true,
  stdio: 'inherit',
});

const cleanup = () => {
  if (!server.killed) {
    server.kill();
  }
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

try {
  await waitFor(`http://127.0.0.1:${port}/health`, timeoutMs);
  await waitFor(`http://127.0.0.1:${port}/`, timeoutMs);
  console.log(`Smoke test passed on port ${port}`);
  cleanup();
  process.exit(0);
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  cleanup();
  process.exit(1);
}
