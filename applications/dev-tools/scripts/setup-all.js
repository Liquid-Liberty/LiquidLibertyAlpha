#!/usr/bin/env node

/**
 * Complete setup script for Liquid Liberty development environment
 * Clones repos, installs dependencies, sets up environment files
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: options.cwd || ROOT_DIR,
      ...options,
    });
    return true;
  } catch (error) {
    log(`Error executing: ${command}`, 'red');
    return false;
  }
}

function checkRequirements() {
  log('\n📋 Checking system requirements...', 'cyan');

  const requirements = {
    node: 'node --version',
    npm: 'npm --version',
    git: 'git --version',
  };

  let allMet = true;
  for (const [name, command] of Object.entries(requirements)) {
    try {
      const version = execSync(command, { encoding: 'utf-8' }).trim();
      log(`  ✓ ${name}: ${version}`, 'green');
    } catch {
      log(`  ✗ ${name}: Not found`, 'red');
      allMet = false;
    }
  }

  // Check optional
  log('\n📦 Checking optional tools...', 'cyan');
  const optional = {
    docker: 'docker --version',
    'docker-compose': 'docker-compose --version',
  };

  for (const [name, command] of Object.entries(optional)) {
    try {
      const version = execSync(command, { encoding: 'utf-8' }).trim();
      log(`  ✓ ${name}: ${version}`, 'green');
    } catch {
      log(`  - ${name}: Not found (optional)`, 'yellow');
    }
  }

  return allMet;
}

function installDependencies() {
  log('\n📦 Installing dependencies for all applications...', 'cyan');

  const apps = [
    'applications/marketplace-contracts',
    'applications/core-api',
    'applications/marketplace-ui',
    'applications/marketplace-indexer',
    'applications/platform-integration-tests',
    'applications/dev-tools',
  ];

  for (const app of apps) {
    const appPath = path.join(ROOT_DIR, app);
    const packageJson = path.join(appPath, 'package.json');

    if (fs.existsSync(packageJson)) {
      log(`\n  Installing ${app}...`, 'blue');
      const success = exec('npm install', { cwd: appPath });
      if (success) {
        log(`  ✓ ${app} dependencies installed`, 'green');
      } else {
        log(`  ✗ Failed to install ${app} dependencies`, 'red');
      }
    }
  }

  // Install Playwright browsers
  log('\n  Installing Playwright browsers...', 'blue');
  const testPath = path.join(ROOT_DIR, 'applications/platform-integration-tests');
  if (fs.existsSync(testPath)) {
    exec('npx playwright install', { cwd: testPath });
  }
}

function setupEnvironmentFiles() {
  log('\n🔧 Setting up environment files...', 'cyan');

  const envConfigs = [
    {
      dir: 'applications/marketplace-contracts',
      example: '.env.example',
      target: '.env',
    },
    {
      dir: 'applications/core-api',
      example: '.env.example',
      target: '.env',
    },
    {
      dir: 'applications/marketplace-ui',
      example: '.env.example',
      target: '.env',
    },
    {
      dir: 'applications/marketplace-indexer/subgraph/lmkt-subquery',
      example: '.env.example',
      target: '.env',
    },
    {
      dir: 'applications/platform-integration-tests',
      example: '.env.example',
      target: '.env',
    },
  ];

  for (const config of envConfigs) {
    const examplePath = path.join(ROOT_DIR, config.dir, config.example);
    const targetPath = path.join(ROOT_DIR, config.dir, config.target);

    if (fs.existsSync(examplePath) && !fs.existsSync(targetPath)) {
      fs.copyFileSync(examplePath, targetPath);
      log(`  ✓ Created ${config.dir}/${config.target}`, 'green');
    } else if (fs.existsSync(targetPath)) {
      log(`  - ${config.dir}/${config.target} already exists`, 'yellow');
    }
  }

  log('\n⚠️  Remember to edit .env files with your configuration!', 'yellow');
}

function displayNextSteps() {
  log('\n✅ Setup complete!', 'green');
  log('\n📝 Next steps:', 'cyan');
  log('  1. Edit .env files in each application with your configuration', 'blue');
  log('  2. Start all services:', 'blue');
  log('     npm run start', 'green');
  log('  3. Or use Docker:', 'blue');
  log('     docker-compose up', 'green');
  log('  4. Run tests:', 'blue');
  log('     cd applications/platform-integration-tests && npm test', 'green');
  log('\n📚 Documentation:', 'cyan');
  log('  - DOCKER_GUIDE.md - Docker usage', 'blue');
  log('  - TESTING_GUIDE.md - Testing guide', 'blue');
  log('  - TESTING_DOCKER_QUICKREF.md - Quick reference', 'blue');
}

async function main() {
  log('🚀 Liquid Liberty Development Environment Setup', 'cyan');
  log('================================================\n', 'cyan');

  // Check requirements
  if (!checkRequirements()) {
    log('\n❌ Please install missing requirements and try again.', 'red');
    process.exit(1);
  }

  // Install dependencies
  installDependencies();

  // Setup environment files
  setupEnvironmentFiles();

  // Display next steps
  displayNextSteps();
}

main().catch((error) => {
  log(`\n❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
});
