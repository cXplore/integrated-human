/**
 * Development script that starts all avatar services before Next.js
 * Run with: node scripts/dev-with-services.js
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const http = require('http');

const SERVICES_DIR = path.join(__dirname, '..', 'services');
const MUSETALK_PYTHON = path.join(SERVICES_DIR, 'MuseTalk', 'venv', 'Scripts', 'python.exe');

const services = [
  {
    name: 'MuseTalk',
    port: 8769,
    command: MUSETALK_PYTHON,
    args: [path.join(SERVICES_DIR, 'musetalk_server.py')],
    startupTime: 60000, // 60 seconds for model loading
  },
  {
    name: 'XTTS',
    port: 8767,
    command: 'python',
    args: [path.join(SERVICES_DIR, 'xtts_server.py')],
    startupTime: 30000,
  },
  {
    name: 'Bridge',
    port: 8768,
    command: 'python',
    args: [path.join(SERVICES_DIR, 'avatar_bridge_server.py')],
    startupTime: 5000,
  },
];

const runningProcesses = [];

function checkHealth(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForService(name, port, timeout) {
  const startTime = Date.now();
  process.stdout.write(`  Waiting for ${name} (port ${port})...`);

  while (Date.now() - startTime < timeout) {
    if (await checkHealth(port)) {
      console.log(' ready!');
      return true;
    }
    await new Promise(r => setTimeout(r, 2000));
    process.stdout.write('.');
  }

  console.log(' timeout!');
  return false;
}

async function startService(service) {
  // Check if already running
  if (await checkHealth(service.port)) {
    console.log(`  ${service.name} already running on port ${service.port}`);
    return true;
  }

  console.log(`  Starting ${service.name}...`);

  const proc = spawn(service.command, service.args, {
    cwd: SERVICES_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
    windowsHide: true,
  });

  runningProcesses.push({ name: service.name, proc });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    lines.forEach(line => console.log(`  [${service.name}] ${line}`));
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    lines.forEach(line => {
      // Filter out common warnings
      if (!line.includes('UserWarning') && !line.includes('FutureWarning')) {
        console.log(`  [${service.name}] ${line}`);
      }
    });
  });

  proc.on('error', (err) => {
    console.error(`  [${service.name}] Failed to start: ${err.message}`);
  });

  return waitForService(service.name, service.port, service.startupTime);
}

async function startAllServices() {
  console.log('\n=== Starting Avatar Services ===\n');

  for (const service of services) {
    const success = await startService(service);
    if (!success) {
      console.log(`  Warning: ${service.name} may not be ready`);
    }
  }

  console.log('\n=== Services Status ===');
  for (const service of services) {
    const ok = await checkHealth(service.port);
    console.log(`  ${service.name}: ${ok ? 'OK' : 'NOT READY'}`);
  }
}

function startNextDev() {
  console.log('\n=== Starting Next.js ===\n');

  const next = spawn('npx', ['next', 'dev'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
  });

  next.on('close', (code) => {
    console.log(`Next.js exited with code ${code}`);
    cleanup();
  });
}

function cleanup() {
  console.log('\nShutting down services...');
  runningProcesses.forEach(({ name, proc }) => {
    console.log(`  Stopping ${name}...`);
    proc.kill();
  });
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Main
(async () => {
  await startAllServices();
  startNextDev();
})();
