import { spawn } from 'node:child_process';
import process from 'node:process';

const port = Number(process.env.SMOKE_PORT || 4173);
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 45000);
const startAt = Date.now();
const startCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const startArgs = process.platform === 'win32' ? ['/c', 'npm run start'] : ['run', 'start'];

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

const server = spawn(startCommand, startArgs, {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
  },
  stdio: 'inherit',
  windowsHide: true,
});

let cleanedUp = false;

async function cleanup() {
  if (cleanedUp || server.killed || !server.pid) {
    cleanedUp = true;
    return;
  }

  cleanedUp = true;

  await new Promise((resolve) => {
    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/pid', String(server.pid), '/t', '/f'], {
        stdio: 'ignore',
        windowsHide: true,
      });

      killer.once('exit', resolve);
      killer.once('error', resolve);
      return;
    }

    const timeout = setTimeout(() => {
      server.kill('SIGKILL');
      resolve();
    }, 3000);

    server.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });

    server.kill('SIGTERM');
  });
}

process.on('SIGINT', () => {
  void cleanup();
});

process.on('SIGTERM', () => {
  void cleanup();
});

server.on('error', async (err) => {
  console.error('Failed to start server:', err);
  await cleanup();
  process.exitCode = 1;
});

try {
  await waitFor(`http://127.0.0.1:${port}/health`, timeoutMs);
  await waitFor(`http://127.0.0.1:${port}/`, timeoutMs);
  console.log(`Smoke test passed on port ${port}`);
  await cleanup();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  await cleanup();
  process.exitCode = 1;
}
