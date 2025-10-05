#!/usr/bin/env node

/**
 * Start all Liquid Liberty applications in the correct order
 * Monitors health and provides status updates
 */

import { spawn } from 'child_process';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const services = [
  {
    name: 'Hardhat Node',
    cwd: path.join(ROOT_DIR, 'applications/liquid-liberty-contracts'),
    command: 'npx',
    args: ['hardhat', 'node'],
    port: 8545,
    healthCheck: () => checkPort(8545),
    color: 'cyan',
    startDelay: 3000,
  },
  {
    name: 'Indexer (Docker)',
    cwd: path.join(ROOT_DIR, 'applications/liquid-liberty-indexer'),
    command: 'docker-compose',
    args: ['up'],
    port: 3000,
    healthCheck: () => checkHttp('http://localhost:3000'),
    color: 'magenta',
    startDelay: 10000,
  },
  {
    name: 'API Functions',
    cwd: path.join(ROOT_DIR, 'applications/liquid-liberty-api'),
    command: 'npx',
    args: ['netlify', 'dev'],
    port: 8888,
    healthCheck: () => checkPort(8888),
    color: 'yellow',
    startDelay: 5000,
  },
  {
    name: 'Frontend',
    cwd: path.join(ROOT_DIR, 'applications/liquid-liberty-frontend'),
    command: 'npm',
    args: ['run', 'dev'],
    port: 5173,
    healthCheck: () => checkPort(5173),
    color: 'blue',
    startDelay: 3000,
  },
];

const processes = [];

function checkPort(port) {
  try {
    execSync(`lsof -i :${port}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function checkHttp(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function waitForService(service) {
  log(`  Waiting for ${service.name} to start...`, 'yellow');

  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const isHealthy = await service.healthCheck();
      if (isHealthy) {
        log(`  ✓ ${service.name} is ready!`, 'green');
        return true;
      }
    } catch (error) {
      // Continue waiting
    }
  }

  log(`  ⚠ ${service.name} health check timeout`, 'yellow');
  return false;
}

function startService(service) {
  log(`\n🚀 Starting ${service.name}...`, service.color);
  log(`   Command: ${service.command} ${service.args.join(' ')}`, 'reset');
  log(`   Directory: ${service.cwd}`, 'reset');

  const proc = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${colors[service.color]}[${service.name}]${colors.reset} ${line}`);
      }
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim() && !line.includes('WARN')) {
        console.log(`${colors[service.color]}[${service.name}]${colors.reset} ${line}`);
      }
    });
  });

  proc.on('error', (error) => {
    log(`❌ ${service.name} error: ${error.message}`, 'red');
  });

  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log(`❌ ${service.name} exited with code ${code}`, 'red');
    }
  });

  processes.push({ name: service.name, process: proc });
  return proc;
}

async function startAll() {
  log('🚀 Starting Liquid Liberty Development Environment', 'cyan');
  log('================================================\n', 'cyan');

  for (const service of services) {
    startService(service);

    // Wait for startup delay
    await new Promise(resolve => setTimeout(resolve, service.startDelay));

    // Check health
    await waitForService(service);
  }

  log('\n✅ All services started!', 'green');
  log('\n📊 Service Status:', 'cyan');
  services.forEach(service => {
    log(`  ${service.name}: http://localhost:${service.port}`, service.color);
  });

  log('\n📝 Commands:', 'cyan');
  log('  Press Ctrl+C to stop all services', 'yellow');
  log('  Check status: npm run status', 'blue');
  log('  Stop all: npm run stop', 'blue');
}

function cleanup() {
  log('\n\n🛑 Stopping all services...', 'yellow');

  processes.forEach(({ name, process }) => {
    try {
      log(`  Stopping ${name}...`, 'yellow');
      process.kill('SIGTERM');
    } catch (error) {
      log(`  Error stopping ${name}: ${error.message}`, 'red');
    }
  });

  log('✅ All services stopped', 'green');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

startAll().catch((error) => {
  log(`\n❌ Failed to start services: ${error.message}`, 'red');
  cleanup();
});
