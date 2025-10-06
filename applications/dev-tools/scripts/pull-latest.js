#!/usr/bin/env node

/**
 * Pull latest changes from all repositories
 * Updates all applications to latest main/master branch
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      cwd: options.cwd || ROOT_DIR,
      stdio: options.silent ? 'pipe' : 'inherit',
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function getCurrentBranch(dir) {
  const result = exec('git rev-parse --abbrev-ref HEAD', { cwd: dir, silent: true });
  return result.success ? result.output.trim() : null;
}

function hasUncommittedChanges(dir) {
  const result = exec('git status --porcelain', { cwd: dir, silent: true });
  return result.success && result.output.trim().length > 0;
}

function pullRepository(dir, repoName) {
  log(`\n📦 Updating ${repoName}...`, 'cyan');

  if (!fs.existsSync(path.join(dir, '.git'))) {
    log(`  ⚠ Not a git repository, skipping`, 'yellow');
    return false;
  }

  const currentBranch = getCurrentBranch(dir);
  log(`  Current branch: ${currentBranch}`, 'blue');

  if (hasUncommittedChanges(dir)) {
    log(`  ⚠ Uncommitted changes detected`, 'yellow');
    log(`  Stashing changes...`, 'yellow');
    exec('git stash', { cwd: dir });
  }

  log(`  Pulling latest changes...`, 'blue');
  const pullResult = exec('git pull origin ' + currentBranch, { cwd: dir });

  if (!pullResult.success) {
    log(`  ✗ Failed to pull: ${pullResult.error}`, 'red');
    return false;
  }

  log(`  ✓ Updated successfully`, 'green');

  // Check if there are stashed changes
  const stashList = exec('git stash list', { cwd: dir, silent: true });
  if (stashList.success && stashList.output.trim()) {
    log(`  ℹ You have stashed changes. Apply with: git stash pop`, 'cyan');
  }

  return true;
}

async function main() {
  log('🔄 Updating All Repositories', 'cyan');
  log('============================\n', 'cyan');

  const repositories = [
    { name: 'Root', path: ROOT_DIR },
    { name: 'Contracts', path: path.join(ROOT_DIR, 'applications/marketplace-contracts') },
    { name: 'API', path: path.join(ROOT_DIR, 'applications/core-api') },
    { name: 'Frontend', path: path.join(ROOT_DIR, 'applications/marketplace-ui') },
    { name: 'Indexer', path: path.join(ROOT_DIR, 'applications/marketplace-indexer') },
    { name: 'Integration Tests', path: path.join(ROOT_DIR, 'applications/platform-integration-tests') },
  ];

  let successCount = 0;
  let skipCount = 0;

  for (const repo of repositories) {
    if (fs.existsSync(repo.path)) {
      const success = pullRepository(repo.path, repo.name);
      if (success) successCount++;
    } else {
      log(`\n⚠ ${repo.name} not found at ${repo.path}`, 'yellow');
      skipCount++;
    }
  }

  log('\n' + '='.repeat(50), 'cyan');
  log(`\n✅ Update Summary:`, 'green');
  log(`  Updated: ${successCount} repositories`, 'green');
  if (skipCount > 0) {
    log(`  Skipped: ${skipCount} repositories`, 'yellow');
  }

  log('\n📦 Next steps:', 'cyan');
  log('  1. Review changes: git log', 'blue');
  log('  2. Update dependencies: npm run update:deps', 'blue');
  log('  3. Run tests: cd applications/platform-integration-tests && npm test', 'blue');
}

main().catch((error) => {
  log(`\n❌ Update failed: ${error.message}`, 'red');
  process.exit(1);
});
