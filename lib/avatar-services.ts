/**
 * Avatar Services Manager
 * Auto-starts Python services for avatar lip sync
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import http from 'http';

const SERVICES_DIR = path.join(process.cwd(), 'services');
const MUSETALK_PYTHON = path.join(SERVICES_DIR, 'MuseTalk', 'venv', 'Scripts', 'python.exe');

interface Service {
  name: string;
  port: number;
  command: string;
  args: string[];
  startupTime: number;
  process?: ChildProcess;
}

const services: Service[] = [
  {
    name: 'MuseTalk',
    port: 8769,
    command: MUSETALK_PYTHON,
    args: [path.join(SERVICES_DIR, 'musetalk_server.py')],
    startupTime: 90000, // 90 seconds for model loading
  },
  {
    name: 'TTS',
    port: 8767,
    command: MUSETALK_PYTHON, // Use MuseTalk venv which has aiohttp
    args: [path.join(SERVICES_DIR, 'tts_server.py')],
    startupTime: 10000,
  },
  {
    name: 'Bridge',
    port: 8768,
    command: MUSETALK_PYTHON, // Use MuseTalk venv which has all deps
    args: [path.join(SERVICES_DIR, 'avatar_bridge_server.py')],
    startupTime: 5000,
  },
];

function checkHealth(port: number): Promise<boolean> {
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

async function waitForService(name: string, port: number, timeout: number): Promise<boolean> {
  const startTime = Date.now();
  console.log(`  [Avatar] Waiting for ${name} (port ${port})...`);

  while (Date.now() - startTime < timeout) {
    if (await checkHealth(port)) {
      console.log(`  [Avatar] ${name} is ready!`);
      return true;
    }
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`  [Avatar] ${name} startup timeout`);
  return false;
}

async function startService(service: Service): Promise<boolean> {
  // Check if already running
  if (await checkHealth(service.port)) {
    console.log(`  [Avatar] ${service.name} already running on port ${service.port}`);
    return true;
  }

  console.log(`  [Avatar] Starting ${service.name}...`);

  try {
    const proc = spawn(service.command, service.args, {
      cwd: SERVICES_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false, // Keep attached to parent process
      windowsHide: true,
    });

    service.process = proc;

    proc.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter((l: string) => l.trim());
      lines.forEach((line: string) => {
        // Only log important messages
        if (line.includes('Starting') || line.includes('ready') || line.includes('error') || line.includes('Error')) {
          console.log(`  [${service.name}] ${line}`);
        }
      });
    });

    proc.stderr?.on('data', (data: Buffer) => {
      const line = data.toString().trim();
      // Filter out common warnings
      if (line && !line.includes('UserWarning') && !line.includes('FutureWarning') && !line.includes('TypedStorage')) {
        console.log(`  [${service.name}] ${line}`);
      }
    });

    proc.on('error', (err) => {
      console.error(`  [Avatar] Failed to start ${service.name}: ${err.message}`);
    });

    return waitForService(service.name, service.port, service.startupTime);
  } catch (err) {
    console.error(`  [Avatar] Error starting ${service.name}:`, err);
    return false;
  }
}

let servicesStarted = false;

export async function startAvatarServices(): Promise<void> {
  if (servicesStarted) {
    console.log('[Avatar] Services already initialized');
    return;
  }

  servicesStarted = true;
  console.log('\n[Avatar] === Starting Avatar Services ===\n');

  // Start services in order
  for (const service of services) {
    await startService(service);
  }

  // Final status
  console.log('\n[Avatar] === Services Status ===');
  for (const service of services) {
    const ok = await checkHealth(service.port);
    console.log(`  ${service.name}: ${ok ? 'OK' : 'NOT READY'}`);
  }
  console.log('');
}

export async function checkServicesHealth(): Promise<Record<string, boolean>> {
  const status: Record<string, boolean> = {};
  for (const service of services) {
    status[service.name.toLowerCase()] = await checkHealth(service.port);
  }
  return status;
}
